/**
 * common properties for firebase database
 *
 * @param {LitElement} baseElement - the LitElement to extend
 */
import { default as FirebaseApp } from './lit-firebase-app-mixin.js';

export const Mixin = (baseElement) => class extends FirebaseApp(baseElement) {

  static get properties() {
    return {

      ...super.properties,

      db: {
        type: Object,
      },

      ref: {
        type: Object
        // computed: '__computeRef(db, path, disabled)',
      },

      /**
       * Path to a Firebase root or endpoint. N.B. `path` is case sensitive.
       * @type {string|null}
       */
      path: {
        type: String
        // value: null,
        // observer: '__pathChanged'
      },

      /**
       * When true, Firebase listeners won't be activated. This can be useful
       * in situations where elements are loaded into the DOM before they're
       * ready to be activated (e.g. navigation, initialization scenarios).
       */
      disabled: {
        type: Boolean,
        value: false
      },

    }

  }

  constructor() {
    super();
    this.appName = '';
  }

  update(props) {
    super.update(props);
    if (props.has('app')) {
      this.__computeDb(this.app);
    }
    if (props.has('db') || props.has('path') || props.has('disabled')) {
      this.__computeRef(this.db, this.path);
    }
  }

  __pathReady(path) {
    return path && path.split('/').slice(1).indexOf('') < 0;
  }

  __computeDb(app) {
    this.db = app ? app.database() : null;
  }

  __computeRef(db, path) {
    if (db == null ||
      path == null ||
      !this.__pathReady(path) ||
      this.disabled) {
      this.ref = null;
      return;
    }

    this.ref = db.ref(path);
  }
}

export default Mixin;
