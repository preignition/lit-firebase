import { UpdatingElement } from 'lit-element';
import { default as FirebaseDatabase } from './lif-database-mixin.js';

const __valueWithKey = (key, value) => {
  const leaf = typeof value !== 'object';

  if (leaf) {
    return { $key: key, $val: value };
  }
  value.$key = key;
  return value;
}

const __snapshotToValue = (snapshot) => __valueWithKey(snapshot.key, snapshot.val());

class LitFirebaseQuery extends FirebaseDatabase(UpdatingElement) {

  static get properties() {
    return {
      ...super.properties,

      /*
       * `data` 
       */
      // data: {
      //   type: Object,
      // }

      /**
       * [`firebase.database.Query`](https://firebase.google.com/docs/reference/js/firebase.database.Query#property)
       * object computed by the following parameters.
       */
      query: {
        type: Object,
      },

      /**
       * The child key of each query result to order the query by.
       *
       * Changing this value generates a new `query` ordered by the
       * specified child key.
       */
      orderByChild: {
        type: String,
        attribute: 'order-by-child'
      },

      /**
       * Order this query by values. This is only applicable to leaf node queries
       * against data structures such as `{a: 1, b: 2, c: 3}`.
       */
      orderByValue: {
        type: Boolean,
        attribute: 'order-by-value'
      },

      /**
       * The value to start at in the query.
       *
       * Changing this value generates a new `query` with the specified
       * starting point. The generated `query` includes children which match
       * the specified starting point.
       */
      startAt: {
        type: String,
        attribute: 'start-at'
      },

      /**
       * The value to end at in the query.
       *
       * Changing this value generates a new `query` with the specified
       * ending point. The generated `query` includes children which match
       * the specified ending point.
       */
      endAt: {
        type: String,
        attribute: 'end-at'
      },

      /**
       * Specifies a child-key value that must be matched for each candidate result.
       *
       * Changing this value generates a new `query` which includes children
       * which match the specified value.
       */
      equalTo: {
        type: Object,
        attribute: 'equal-to'
      },

      /**
       * The maximum number of nodes to include in the query.
       *
       * Changing this value generates a new `query` limited to the first
       * number of children.
       */
      limitToFirst: {
        type: Number,
        attribute: 'limit-to-first'
      },

      /**
       * The maximum number of nodes to include in the query.
       *
       * Changing this value generates a new `query` limited to the last
       * number of children.
       */
      limitToLast: {
        type: Number,
        attribute: 'limit-to-last'
        // value: 0
      }
    }
  }

  constructor() {
    super();
    this.__map = {};
    this.__remote = [];
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this.query) {
      this.__removeListeners(this.query);
    }
  }

  update(props) {
    super.update(props);
    this.log && console.info('update query props', props.keys());
    if (props.has('ref') || props.has('orderByChild') || props.has('orderByValue') || props.has('limitToFirst') || props.has('limitToLast') || props.has('startAt') || props.has('endAt') || props.has('equalTo')) {
      this.__setQuery(this.ref, props.get('ref'))
    }
    if (props.has('query')) {
      this.__queryChanged(this.query, props.get('query'))
    }
  }

  __setRef(ref, old) {
    if (old) {
      old.off('value', this.onValue, this);
    }
    if (ref) {
      ref.on('value', this.onValue, this.onError, this);
    }
  }

  __setQuery(ref) {
    if (ref == null) {
      this.query = null;
      return
    }

    let query;

    if (this.orderByChild) {
      query = ref.orderByChild(this.orderByChild);
    } else if (this.orderByValue) {
      query = ref.orderByValue();
    } else {
      query = ref.orderByKey();
    }

    if (this.limitToFirst) {
      query = query.limitToFirst(this.limitToFirst);
    } else if (this.limitToLast) {
      query = query.limitToLast(this.limitToLast);
    }

    if (this.startAt !== undefined) {
      query = query.startAt(this.startAt);
    }

    if (this.endAt !== undefined) {
      query = query.endAt(this.endAt);
    }

    if (this.equalTo !== undefined) {
      query = query.equalTo(this.equalTo);
    }

    this.query = query;
  }

  __removeListeners(query) {
    query.off('value', this.__onFirebaseValue, this);
    query.off('child_added', this.__onFirebaseChildAdded, this);
    query.off('child_removed', this.__onFirebaseChildRemoved, this);
    query.off('child_changed', this.__onFirebaseChildChanged, this);
    query.off('child_moved', this.__onFirebaseChildMoved, this);

  }

  __queryChanged(query, oldQuery) {
    if (oldQuery) {
      this.__removeListeners(oldQuery)

      this.__remote = [];
      this.__map = {};
    }

    // this allows us to just call the addition of event listeners only once.
    // __queryChanged is being called thrice when firebase-query is created
    // 1 - 2. query property computed (null, undefined)
    // 3. when attached is called (this.query, this.query)
    // need help to fix this so that this function is only called once

    if (query) {
      query.on('value', this.__onFirebaseValue, this.onError, this);
    }
  }

  __indexFromKey(key) {
    return this.__remote.findIndex(item => item.$key === key);
  }

  __onFirebaseValue(snapshot) {
    if (snapshot.hasChildren()) {
      const data = [];
      snapshot.forEach((childSnapshot) => {
        const { key } = childSnapshot;
        const value = __valueWithKey(key, childSnapshot.val())

        this.__map[key] = value;
        data.push(value)
      })

      this.__remote = data;
    }
    this.dispatchValue();
    // this.dispatchChange(false, !!this._remote);
    this.log && console.info('set value', this.__remote);

    const { query } = this;

    query.on('child_added', this.__onFirebaseChildAdded, this.onError, this);
    query.on('child_removed', this.__onFirebaseChildRemoved, this.onError, this);
    query.on('child_changed', this.__onFirebaseChildChanged, this.onError, this);
    query.on('child_moved', this.__onFirebaseChildMoved, this.onError, this);
  }

  __onFirebaseChildAdded(snapshot, previousChildKey) {
    const key = snapshot.key;

    // check if the key-value pair already exists
    if (this.__indexFromKey(key) >= 0) return

    // const value = snapshot.val();
    const previousChildIndex = this.__indexFromKey(previousChildKey);


    const value = __snapshotToValue(snapshot);
    this.log && console.info('Firebase child_added:', key, value);

    this.__map[key] = value;
    this.__remote.splice(previousChildIndex + 1, 0, value);
    this.dispatchValue();
  }

  __onFirebaseChildRemoved(snapshot) {

    const key = snapshot.key;
    const value = this.__map[key];

    this.log && console.info('Firebase child_removed:', key, value);

    if (value) {
      this.__map[key] = null;
      if (this.__indexFromKey(key) >= 0) {
        this.__remote.splice(this.__indexFromKey(key), 1);
      }
     this.dispatchValue();
    }
  }

  __onFirebaseChildChanged(snapshot) {
    const key = snapshot.key;
    const prev = this.__map[key];

    this.log && console.info('Firebase child_changed:', key, prev);

    if (prev) {
      const index = this.__indexFromKey(key);
      const value = __snapshotToValue(snapshot);

      this.__map[key] = value;
      if (value instanceof Object) {
        for (const property in value) {
          this.__remote[index][property] = value[property];
        }
        for (const property in prev) {
          if (!value.hasOwnProperty(property)) {
            this.__remote[index][property] = null;
          }
        }
      } else {
        this.__remote[index] = value;
      }

    }
    this.dispatchValue();
  }

  __onFirebaseChildMoved(snapshot, previousChildKey) {
    const key = snapshot.key;
    const value = this.__map[key];
    const targetIndex = previousChildKey ? this.__indexFromKey(previousChildKey) + 1 : 0;

    this.log && console.info('Firebase child_moved:', key, value, 'to index', targetIndex);

    if (value) {
      const index = this.__indexFromKey(key);

      this.__map[key] = __snapshotToValue(snapshot);
      this.__remote.splice(index, 1);
      this.__remote.splice(targetIndex, 0, this.__map[key]);

      this.dispatchValue();

    }
  }

}

export default LitFirebaseQuery;

// Register the new element with the browser.
customElements.define('lif-query', LitFirebaseQuery);
