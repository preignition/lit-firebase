/**
 * common properties for firebase database
 *
 * @param {LitElement} baseElement - the LitElement to extend
 */
import  FirebaseApp from './lif-app-mixin.js';
import NetworkStatus from './lif-network-status-mixin.js';


/**
 * cheks whether path is a valid path
 * @param  {String} path firebase database path
 * @return {Boolean}      true if path is valid
 */
const pathReady = (path) => path && path.split('/').slice(1).indexOf('') < 0;

export const Mixin = (baseElement) => class extends NetworkStatus(FirebaseApp(baseElement)) {

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
      }

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
   * @override
   * Updates the `online` property to reflect the browser connection status.
   */
  refreshNetworkStatus() {
    if (!this.ref) {
      return;
    }

    if (window.navigator.onLine) {
      this.db.goOnline();
    } else {
      this.db.goOffline();
    }
  }

  /**
   * notify outisde world about change 
   * we need to set path in event detail to make sure the value is read from detail and not form 
   * host property (see Polymer property-effects handleNotification)
   * @param  {Boolean} loading           true if we are loading data (just once this.ref is set)
   * @param  {Boolean} skipDispatchValue when true 
   * @return {[type]}                   [description]
   */
  __dispatchChange(loading) {

    if (!loading) {
      this.log && console.info('data-changed', this.__remote);

      /*
      
      Note(cg): we need this as we are dispatching event without path.
      Polymer handles notifications differently:
        if (fromPath) {
          toPath = Polymer.Path.translate(fromProp, toPath, fromPath);
          value = detail && detail.value;
        } else {
          value = event.currentTarget[fromProp];
        }

      */

      this.dispatchEvent(new CustomEvent('data-changed', { detail: { value: this.__remote } }));
    }
    this.dispatchEvent(new CustomEvent('loading-changed', { detail: { value: loading, path: 'loading' } }));
    this.dispatchEvent(new CustomEvent('exists-changed', { detail: { value: loading ? null : !(this.__remote === null || this.__remote === undefined), path: 'exists' } }));
  }
}

export default Mixin;
