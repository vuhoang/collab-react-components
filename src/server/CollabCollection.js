import CollabServer from './CollabServer';
import _ from 'underscore';

export default class CollabCollection {
  /**
   * @param {Object} collectionName The name of the collection to bind to ShareDB
   */
  constructor(collectionName) {
    const backend = CollabServer.backend;
    if (backend === null) {
      throw new Error(
        'CollabCollection: You should start the CollabServer before using the model.'
      );
    }

    this.connection = backend.connect();
    this.collectionName = 'collab_data_' + collectionName;
  }

  /**
   * Creates a new document.
   *
   * @param {String} id The document id
   * @param {String} data The document initial data string.
   * @returns {Doc} The Document created
   */
  create(id, data = '') {
    const doc = this.connection.get(this.collectionName, id);
    doc.fetch(err => {
      if (err) throw err;
      if (doc.type === null) {
        doc.create(data, function(err) {
          if (err) throw err;
        });
      }
    });
    return doc;
  }

  /**
   * Creates a new document for rich text editors.
   *
   * @param {String} id The document id
   * @param {String} data The document initial data string.
   * @returns {Doc} The Document created
   */
  createRichText(id, data = '') {
    const doc = this.connection.get(this.collectionName, id);
    doc.fetch(err => {
      if (err) throw err;
      if (doc.type === null) {
        doc.create([{ insert: data }], 'rich-text', function(err) {
          if (err) throw err;
          return doc;
        });
      }
    });

    return doc;
  }

  /**
   * Creates a new form given a schema.
   *
   * @param {String} id The form id
   * @param {Object} schema The form schema used to generate the data object
   * @param {function} callback The callback in case of error
   * @returns {Doc} The Form created
   */
  createForm(id, schema = {}, callback = () => {}) {
    const doc = this.connection.get(this.collectionName, id);
    doc.fetch(err => {
      if (err) throw err;
      // If the document doesn't already exist, we create it following the schema.
      if (doc.type === null) {
        // If root type is not object, then error:
        if (schema.type !== 'object') {
          callback(
            Error('CollabCollection: The root element must be an object')
          );
        }

        let data = {};

        _.each(schema.properties, function(value, key) {
          let prop = {};
          // If it is a String, we create an empty string if the default value is empty.
          if (value.type === 'string') {
            prop[key] = typeof value.default === 'undefined'
              ? ''
              : value.default;
          } else if (value.type === 'boolean') {
            prop[key] = typeof value.default === 'undefined'
              ? false
              : value.default;
          } else if (value.type === 'integer' || value.type === 'number') {
            prop[key] = typeof value.default === 'undefined'
              ? 0
              : value.default;
          } else {
            prop[key] = typeof value.default === 'undefined'
              ? null
              : value.default;
          }

          _.extend(data, prop);
        });

        doc.create({ schema, data }, function(err) {
          if (err) throw err;
          return doc;
        });
      }
    });

    return doc;
  }

  /**
   * Deletes a document with ID id.
   *
   * @param {String} id  The document ID
   * @returns {void}
   */
  remove(id) {
    const doc = this.connection.get(this.collectionName, id);
    doc.subscribe(err => {
      if (err) throw err;
      doc.del();
    });
  }
}
