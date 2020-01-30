import { html, fixture, expect } from '@open-wc/testing';
import firebase from 'firebase/app';
import * as database from 'firebase/database';


import '../src/lit-firebase-query.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDTP-eiQezleFsV2WddFBAhF_WEzx_8v_g',
  authDomain: 'polymerfire-test.firebaseapp.com',
  databaseURL: 'https://polymerfire-test.firebaseio.com',
}


// Note(cg): make firabase global.
if (!window.firebase) {
  firebase.initializeApp(firebaseConfig);
  firebase.initializeApp(firebaseConfig, 'DB');
  window.firebase = firebase;
}

const clearTest = () => {
  return firebase.app().database().ref('/testQuery').remove();
}

describe('Lit Firebase Query', () => {
  it('is instantiated with a default database', async () => {
    const el = await fixture(html `
      <lit-firebase-query ></lit-firebase-query>
    `);

    expect(el.app.name).to.equal('[DEFAULT]');
  });

  it('is instantiated with a named database', async () => {
    const el = await fixture(html `
      <lit-firebase-query app-name="DB"></lit-firebase-query>
    `);

    expect(el.app.name).to.equal('DB');
  });

  it('reacts when we push data', (done) => {
    let val;
    let key;

    const el = fixture(html `
    <lit-firebase-query path="/testQuery" @data-changed="${(e) => {val = e.detail.value; }}"></lit-firebase-query>
  `);

    clearTest()
      .then(() => {
        return firebase.app().database().ref('/testQuery').push('a');
      })
      .then((snap) => {
        key = snap.key;
        expect(val.length).to.equal(1);
        expect(val[0].$key).to.equal(key);
        expect(val[0].$val).to.equal('a');
        done();
      })
  }).timeout(5000);

  it('reads data on instantiation', async () => {
    let val;

    const el = await fixture(html `
      <lit-firebase-query path="/testQuery" @data-changed="${(e) => {val = e.detail.value; }}"></lit-firebase-query>
    `);

    expect(val.length).to.equal(1);
    expect(val[0].$val).to.equal('a');
  }).timeout(5000);

  it('reacts when we update data', (done) => {
    let val;

    const el = fixture(html `
    <lit-firebase-query path="/testQuery" @data-changed="${(e) => {val = e.detail.value; }}"></lit-firebase-query>
  `);

    firebase.app().database().ref('/testQuery/b').update({ a: 1 })
      .then((snap) => {
        expect(val.length).to.equal(2);
        expect(val[1].$key).to.equal('b');
        expect(val[1].a).to.equal(1);
        done();
      })
  }).timeout(5000);
  
  it('reacts when we update data value', (done) => {
    let val;

    const el = fixture(html `
    <lit-firebase-query path="/testQuery" @data-changed="${(e) => {val = e.detail.value; }}"></lit-firebase-query>
  `);

    firebase.app().database().ref('/testQuery/b').update({ a: 2 })
      .then((snap) => {
        expect(val.length).to.equal(2);
        expect(val[1].$key).to.equal('b');
        expect(val[1].a).to.equal(2);
        done();
      })
  }).timeout(5000);

  it('limits query result when limit-to-first is set', async () => {
    let val;

    const el = await fixture(html `
    <lit-firebase-query path="/testQuery" limit-to-first="1" @data-changed="${(e) => {val = e.detail.value; }}"></lit-firebase-query>
  `);

  expect(val.length).to.equal(1);
  
  });

  it('limits query result when limit-to-last is set', async () => {
    let val;

    const el = await fixture(html `
    <lit-firebase-query path="/testQuery" limit-to-last="1" @data-changed="${(e) => {val = e.detail.value; }}"></lit-firebase-query>
  `);

  expect(val.length).to.equal(1);
  expect(val[0].$key).to.equal('b');
  expect(val[0].a).to.equal(2);
  
  });

  it('reacts when we remove data', async () => {
    let val;
    firebase.app().database().ref('/testQuery').remove()

    const el = await fixture(html `
      <lit-firebase-query path="/testQuery" @data-changed="${(e) => {val = e.detail.value}}"></lit-firebase-query>
    `);

    expect(val.length).to.equal(0);
  });

});
