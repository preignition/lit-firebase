/**
 * common properties for firebase database
 *
 * @param {LitElement} baseElement - the LitElement to extend
 */
import { default as FirebaseApp } from './lit-firebase-app-mixin.js';


/**
 * cheks whether path is a valid path
 * @param  {String} path firebase database path
 * @return {Boolean}      true if path is valid
 */
const pathReady = (path) => path && path.split('/').slice(1).indexOf('') < 0;

export const Mixin = (baseElement) => class extends FirebaseApp(baseElement) {

  static get properties() {
    return {

      ...super.properties,

      db: {
        type: Object,
      },

      ref: {
        type: Object
      },

      /**
       * Path to a Firebase root or endpoint. N.B. `path` is case sensitive.
       * @type {string|null}
       */
      path: {
        type: String
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

  __computeDb(app) {
    this.db = app ? app.database() : null;
  }

  __computeRef(db, path) {
    if (db == null ||
      path == null ||
      !pathReady(path) ||
      this.disabled) {
      this.ref = null;
      return;
    }

    this.ref = db.ref(path);
    this.dispatchLoading();
  }

  /**
   * called when we start loading data, i.e. when this.ref is set
   */
  dispatchLoading() {
    this.__dispatchChange(true);
  }
  
  /**
   * called when we we have received data 
   */
  dispatchValue() {
    this.__dispatchChange(false);
  }

  /**
   * notify outisde world about change 
   * @param  {Boolean} loading           true if we are loading data (just once this.ref is set)
   * @param  {Boolean} skipDispatchValue when true 
   * @return {[type]}                   [description]
   */
  __dispatchChange(loading) {
    if(!loading) {
      this.log &&  console.info('data-changed', this.__remote);
      this.dispatchEvent(new CustomEvent('data-changed', { detail: { value: this.__remote }, bubbles: true, composed: true }));
    }
    this.dispatchEvent(new CustomEvent('loading-changed', { detail: { value: loading }, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('exists-changed', { detail: { value: loading ? null : !!this.__remote }, bubbles: true, composed: true }));
  }
}

export default Mixin;
