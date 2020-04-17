import { html, fixture, expect, elementUpdated, aTimeout  } from '@open-wc/testing';
import firebase from 'firebase/app';
import * as database from 'firebase/database';


import '../src/lif-span.js';

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

describe('Lit Firebase Span', () => {
  it('is instantiated with a default database', async () => {
    const el = await fixture(html `
      <lif-span></lif-span>
    `);

    expect(el.app.name).to.equal('[DEFAULT]');
  });

  it('is instantiated with a named database', async () => {
    const el = await fixture(html `
      <lif-span app-name="DB"></lif-span>
    `);

    expect(el.app.name).to.equal('DB');
  });
});

describe('Lit Firebase Span', () => {
  before(async () => {
    console.info('before')
    await firebase.app().database().ref('/testDocument/a').set(2)
  })

  it('reacts when we update data value', async () => {

    const el = fixture(html `
      <lif-span log path="/testDocument/a" ></lif-span>
    `);
    aTimeout(2000);
    await elementUpdated(el);

    expect(el.value).to.equal(2);
    expect(el.innerText).to.equal('2');
  })




});
