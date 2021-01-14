import { UpdatingElement } from 'lit-element';
import FirebaseApp from './lif-app-mixin.js';
// import { default as FirebaseDatabase } from './lif-database-mixin.js';

/**
 * cheks whether path is a valid path
 * @param  {String} path firebase database path
 * @return {Boolean}      true if path is valid
 */
const pathReady = (path) => {
  const split = path && path.split('/').slice(1);
  return split.indexOf('') < 0 && split.indexOf('undefined') < 0;
};


const decorate = (data, id, change) => {
  data.$id = id;
}

const getter = (doc, fieldPath) => {
  return fieldPath 
    ? (Array.isArray(fieldPath) 
      ? fieldPath.reduce((obj, key) => {
        obj[key] = doc.get(key) || {};
        return obj;
      }, {}) 
      : doc.get(fieldPath) || {})
        : doc.data();
      };

class LifStore extends FirebaseApp(UpdatingElement) {

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

      /*
       * `fieldPath` if set, will use DocumentSnapshot.get(fieldPath) instead of DocumentSnapshot.data().``
       *  WHen fieldPath is an Array, will collect all fields. 
       */
      fieldPath: {
        type: String,
      },

      /*
       * `where` the where query {field: 'field', op: '==', value: 123}
       */
      where: {
        type: Object
      },

      /*
       * `decorate` a function decorate collection data 
       */
      decorate: {
        type: Function,
      },
    }
  }

  constructor() {
    super();
    this.decorate = decorate;
  }

  get data() {
    return this.__remote;
  }

  set data(value) {
    if (value === undefined || this._refType === 'collection') { return }
    const setData = (val) => {
      if (val !== this.__remote || (val === Object(val) && JSON.stringify(val) !== JSON.stringify(this.__remote))) {
        this.log && console.info('settings value to remote', this.fieldPath, val);
        if(this.fieldPath) {
          if(Array.isArray(this.fieldPath)) {
            throw 'Document Store can only have String fieldPath'
          }
          this.ref.update({[this.fieldPath]: val})
            .catch(e => this.onError(e));  
        } else {
          this.ref.set(val)
            .catch(e => this.onError(e));
          }
      }
    }

    // Note(cg): only set data once __remote is known.
    if (this.__remote === undefined) {
      this.addEventListener('data-changed', () => { setData(value) }, { once: true })
      return;
    }
    setData(value);
  }


  save(data) {
    this.data = data;
  }

  disconnectedCallback() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
    super.disconnectedCallback();
  }

  update(props) {
    if (this.log) {
      console.info('update query props');
      for (const item of props) console.info(item);
    }
    if (props.has('app')) {
      this.__computeDb(this.app);
    }
    if (props.has('db') || props.has('path') || props.has('where')) {
      this.__computeRef(this.db, this.path);
    }
    if (props.has('ref')  ) {
      this.__setRef(this.ref, props.get('ref'))
    }
    if (props.has('decorate')) {
      if (this.refType === 'collection' && this.__remote && this.ref) {
        this.__readCollection(this.ref);
      }
    }
    super.update(props);
  }

  __computeDb(app) {
    this.db = app ? app.firestore() : null;
  }

  __computeRef(db, path) {
    if (db == null ||
      path == null ||
      !pathReady(path)) {
      this.ref = null;
      return;
    }

    const split = path.split('/').splice(1)
    this.ref = split.reduce((ref, name, index) => {
      let query = ref instanceof firebase.firestore.CollectionReference ? ref.doc(name) : ref.collection(name);
      if (query instanceof firebase.firestore.CollectionReference && index < 2 && this.where) {
        query.where(this.where.field, this.where.op, this.where.value);
      }
      return query;
    }, db);
    this.dispatchEvent(new CustomEvent('ref-changed', { detail: { value: this.ref } }));
  }

  async __setRef(ref, old) {
    if (old) {
      this.__remote = undefined;
      this.refType = null;
      this._unsubscribe();
    }
    if (ref) {
      if (ref instanceof firebase.firestore.CollectionReference) {
        this.log && console.info('collection ref');
        this.refType = 'collection';
        this.__subscribeCollection(ref);
      } else {
        this.log && console.info('document ref');
        this.refType = 'document';
        this.__subscribeDocument(ref);
      }
    }
  }

  __subscribeDocument(ref) {
    this._unsubscribe = ref.onSnapshot((doc) => {
      this.__remote = getter(doc, this.fieldPath); 
      this.log && console.info('document data', this.__remote);
      this.__dispatchChange()
    });
  }

  __subscribeCollection(ref) {
    
    this._unsubscribe = ref.onSnapshot((snapshot) => {
      // Note(cg): we do not react until the first get is complete.
      if (this._firstLoadCompleted) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = getter(change.doc, this.fieldPath); 
            this.decorate(data, change.doc.id, change);
            this.__remote = this.__remote.concat([data]);
            this.dispatchEvent(new CustomEvent('firestore-added', { detail: change }));
          }
          if (change.type === 'modified') {
            const data = getter(change.doc, this.fieldPath); 
            this.decorate(data, change.doc.id, change);
            this.__remote[change.oldIndex] = data;
            this.__remote = this.__remote.concat();
            this.dispatchEvent(new CustomEvent('firestore-modified', { detail: change }));
          }
          if (change.type === 'removed') {
            const { id } = change.doc;
            this.__remote = this.__remote.filter(item => item.$id !== id);
            this.dispatchEvent(new CustomEvent('firestore-removed', { detail: change }));
          }
        });
        this.__dispatchChange();
      }
    }, this.onError);

    this.__readCollection(ref);
  }

  async __readCollection(ref) {
    [this.__remote] = await Promise.all([
      await ref.get().then(snap => {
        this._firstLoadCompleted = true;
        return snap.docs.map((doc) => {
          const data = getter(doc, this.fieldPath); 
          this.decorate(data, doc.id)
          return data;
        });
      })
    ]);
    this.__dispatchChange();
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

export default LifStore;

// Register the new element with the browser.
customElements.define('lif-store', LifStore);
