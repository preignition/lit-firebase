import { html, fixture, expect, elementUpdated, aTimeout  } from '@open-wc/testing';
import firebase from 'firebase/app';
import * as database from 'firebase/database';


import '../src/lit-firebase-document.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDTP-eiQezleFsV2WddFBAhF_WEzx_8v_g',
  authDomain: 'polymerfire-test.firebaseapp.com',
  databaseURL: 'https://polymerfire-test.firebaseio.com',
}

if (!window.firebase) {

  firebase.initializeApp(firebaseConfig);
  firebase.initializeApp(firebaseConfig, 'DB');

  // Note(cg): make firabase global.
  window.firebase = firebase;
}

const clearTest = () => {
  return firebase.app().database().ref('/testDocument').remove();
}

describe('Lit Firebase Document', () => {
  it('is instantiated with a default database', async () => {
    const el = await fixture(html `
      <lit-firebase-document></lit-firebase-document>
    `);

    expect(el.app.name).to.equal('[DEFAULT]');
  });

  it('is instantiated with a named database', async () => {
    const el = await fixture(html `
      <lit-firebase-document app-name="DB"></lit-firebase-document>
    `);

    expect(el.app.name).to.equal('DB');
  });

  it('reacts when we set data', (done) => {
    let val;

    clearTest()
      .then(() => {
        firebase.app().database().ref('/testDocument/myValue').set('a')
        const el = fixture(html `
        <lit-firebase-document path="/testDocument/myValue" @data-changed="${(e) => {val = e.detail.value}}"></lit-firebase-document>
      `);
        return el;
      })
      .then(() => {
        expect(val).to.equal('a');
        done();
      })
  });

  it('reacts when we remove data', async () => {

    let val;
    firebase.app().database().ref('/testDocument/myValue').remove()

    const el = await fixture(html `
      <lit-firebase-document path="/testDocument/myValue" @data-changed="${(e) => {val = e.detail.value}}"></lit-firebase-document>
    `);

    expect(val).to.equal(null);
  });

  it('can set data', async () => {

    let val;
    const data = { a: 1 };
    firebase.app().database().ref('/testDocument/myValue').remove()

    const el = await fixture(html `
      <lit-firebase-document .data="${data}" path="/testDocument/myValue" @data-changed="${(e) => {val = e.detail.value}}"></lit-firebase-document>
    `);

    expect(val.a).to.equal(1);
  });

  it('does not fire a change when we set same data', async () => {

    let val;
    const data = { a: 1 };
    let count = 0;

    const el = await fixture(html `
      <lit-firebase-document path="/testDocument/myValue" @data-changed="${(e) => {val = e.detail.value; count++;}}"></lit-firebase-document>
    `);

    await elementUpdated(el);
    expect(count).to.equal(1);
    expect(val.a).to.equal(1);

    el.data = data;
    await elementUpdated(el);
    expect(count).to.equal(1);
    expect(val.a).to.equal(1);
  });


  it('does fire a change when we set child data', async () => {

    let val;
    const data = { a: 2 };
    let count = 0;

    const el = await fixture(html `
      <lit-firebase-document path="/testDocument/myValue" @data-changed="${(e) => {val = e.detail.value; count++;}}"></lit-firebase-document>
    `);

    await elementUpdated(el);
    expect(count).to.equal(1);
    expect(val.a).to.equal(1);


    el.data = data;
    await elementUpdated(el);
    expect(count).to.equal(2);
    expect(val.a).to.equal(2);
  });

  it('sets data even if we define ref later on ', async () => {

    let val;
    let count = 0;

    const el = await fixture(html `
      <lit-firebase-document  @data-changed="${(e) => {val = e.detail.value; count++;}}"></lit-firebase-document>
    `);

    el.data = {a:3}
    await elementUpdated(el);

    el.path="/testDocument/myValue"
    await elementUpdated(el);

    expect(count).to.equal(2);
    expect(val.a).to.equal(3);

    
  });

});
