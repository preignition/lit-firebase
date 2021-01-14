import { html, fixture, expect, elementUpdated, aTimeout  } from '@open-wc/testing';
import firebase from 'firebase/app';
import 'firebase/firestore';


import '../src/lif-store.js';

const firebaseConfig = {
  // Note(cg): replace by config for which /testCollection can be writted to.
  apiKey: 'AIzaSyDTP-eiQezleFsV2WddFBAhF_WEzx_8v_g',
  authDomain: 'polymerfire-test.firebaseapp.com',
  databaseURL: 'https://polymerfire-test.firebaseio.com',
  projectId: 'polymerfire-test'
}

if (!window.firebase) {

  firebase.initializeApp(firebaseConfig);
  firebase.initializeApp(firebaseConfig, 'DB');

  // Note(cg): make firabase global.
  window.firebase = firebase;
}

const clearTest = () => {
  console.info('Clear');
  return firebase.app().firestore().doc('/testCollection/testDoc').delete();
  return firebase.app().firestore().doc('/testCollection/testDoc2').delete();
}

describe('Lit Firestore', () => {
  it('is instantiated with a default database', async () => {
    const el = await fixture(html `
      <lif-store></lif-store>
    `);

    expect(el.app.name).to.equal('[DEFAULT]');
  });

  it('is instantiated with a named database', async () => {
    const el = await fixture(html `
      <lif-store app-name="DB"></lif-store>
    `);

    expect(el.app.name).to.equal('DB');
  });

  it('reacts when we set data', (done) => {
    let val;
    const el = fixture(html `
      <lif-store path="/testCollection/testDoc" @data-changed="${(e) => {console.info('DATA', e.detail); val = e.detail.value;}}"></lif-store>
   `);

    clearTest()
      .then(() => {
        return firebase.app().firestore().collection('testCollection').doc('testDoc').set({test: 'b'})
      })
      .then( async () => {
        await elementUpdated(el);
        if(val) {
        expect(val.test).to.equal('b');
        done();
        }
      })
  });

  it('reads collection', (done) => {
    let val;
    const where = {
      field: 'test', 
      op: '==',
      value: 'b'
    }
    const el = fixture(html `
      <lif-store path="/testCollection" .where="${where}" @data-changed="${(e) => {
          console.info('DATA', e.detail); 
          val = e.detail.value;
          expect(val.length).to.equal(2);
          done();
        }
       }"></lif-store>
   `);
    
    firebase.app().firestore().collection('testCollection').doc('testDoc2').set({test: 'b', value: 1})
      
  });


});

