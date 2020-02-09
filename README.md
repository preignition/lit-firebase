# \<preignition/lit-firebase>

This webcomponent follows the [open-wc](https://github.com/open-wc/open-wc) recommendation.

A lit-element based implementation of [polymerfire](https://github.com/FirebaseExtended/polymerfire).

For the time being, only `firebase-document` and `firebase-query` have been migrated (to resp. `lit-firebase-document` and `lit-firebase-query`). 
`firebase-auth` and `firebase-app` will not be upgraded as it is usually simpler to instantiate database and handle authentication via js. 

Those components require firebase SDK to be made available on the client (see https://firebase.google.com/docs/web/setup).

Use at your own risks as this is beta product. 


## Installation
```bash
npm i @preignition/lit-firebase
```

## Usage
```html
<script type="module">
  import '@preignition/lit-firebase';
</script>

and in lit-element render: 

<lit-firebase-document path="myPath" @data-changed="${e=> this.data = e.detail.value}"></lit-firebase-document>
<lit-firebase-query path="myPath" @data-changed="${e=> this.data = e.detail.value}"></lit-firebase-query>
```

## Testing with Karma
To run the suite of karma tests, run
```bash
npm run test
```
or to run them in compatibility mode for legacy browsers
```bash
npm run test:compatibility
```

To run the tests in watch mode (for <abbr title="test driven development">TDD</abbr>, for example), run

```bash
npm run test:watch
```
or
```bash
npm run test:compatibility
```
