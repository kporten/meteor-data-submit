# meteor-data-submit

You need an easy solution to submit and upload all kind of form data to your meteor methods, especially files? Then `meteor-data-submit` is the right tool for you.

This package can be used flexibly with all kind of server-side storage solutions as AWS S3 or your local file system. Submit your form values and files with one simple function call. A progress status for large file uploads is also part of this package.

## Installation

```
$ meteor add kporten:data-submit
```

## Requirements

> Meteor >= 1.3.2.4

```
$ meteor npm install lodash
```

## Example usage

> The module can be used only on client-side. You can implement your own storage solution on server-side. So this package is compatible with different file storages.

### Import the package

```javascript
import { DataSubmit } from 'meteor/kporten:data-submit';
```

### Create your html form

> Please replace ...text... with your favorite template variables, to submit the form and update the progress bar.

```html
<form ...handle submit...>
  <input name="fileList" type="file" multiple />
  <progress value="...current progress..." max="100"></progress>
  <input type="submit" />
</form>
```

### Create your Meteor methods

> `console.log` is only for your information on the first use.

```javascript
import fs from 'fs';
import mime from 'mime';
import { Meteor } from 'meteor/meteor';

Meteor.methods({
  // the following function name will be explained in the next step of this example
  myData(err, files, arg2, arg3, arg4) {
    if (err) throw new Meteor.Error(500, err);

    files.forEach(file => {
      console.log(file.name, file.size, file.type, file.id);

      if (file.buffer && Meteor.isServer) {
        console.log('buffer', file.buffer.length);

        // write a file to the local file system (please modify the following code to support your storage solution)
        Meteor.wrapAsync(fs.writeFile)(`./${file.name}`, new Buffer(file.buffer));
        // ./ => .meteor/local/build/programs/server/
      }
    });

    console.log('arg2', arg2);
    console.log('arg3', arg3);
    console.log('arg4', arg4);

    return true;
  },
  // the following function name will be explained in the next step of this example
  uploadChunk(fileInfos, chunk) {
    if (Meteor.isServer) {
      console.log(fileInfos, chunk.length);

      // write a file to the local file system (please modify the following code to support your storage solution)
      Meteor.wrapAsync(
        fs.appendFile
      )(
        `./${fileInfos.id}.${mime.extension(fileInfos.type)}`,
        new Buffer(chunk)
      );
      // ./ => .meteor/local/build/programs/server/
    }
  },
});
```

### Submit your form data to the server

> In the progress callback function, you can update the progress in your html template to visualize the current state of the upload. If you don't need a progress bar, maybe because your files aren't large, you can remove `chunkUpload` and `chunkBytes`. This will result in a direct upload without chunks and you don't have to define a separate `chunkUpload`-function.

```javascript
DataSubmit.call(
  {
    method: 'myData',
    chunkUpload: 'uploadChunk',
    chunkBytes: 128 * 1024,
  },
  fileList,
  { a: 1, b: 2 },
  'x',
  'y',
  (err, res) => {
    console.log('DataSubmit call =>', 'err =', err, 'res =', res);
  },
  (progressTotal, progressList) => {
    console.log('DataSubmit progress =>', progressTotal, progressList);
  }
);
```

## API

* **.call(config, [form, data, ...], [method callback], [progress callback])**
  * **config**
    * Structure:
      * method: *String* (required, `Meteor.methods` name, this function will receive arguments in the same order as `DataSubmit.call` after the `config` argument without the callbacks)
      * chunkUpload: *String|undefined* (optional, `Meteor.methods` name)
      * chunkBytes: *Integer|undefined* (optional, a smaller size results in more precise progress values, default: 128 * 1024)
    * Description:
      * Required method call configuration. All methods must be defined in your main Meteor app
  * **form data**
    * Description:
      * Optional method arguments of any type. Arguments of type `FileList` must be top level arguments (see the example) or a first level value in an object
  * **method callback**
    * Arguments:
      * err: *Any* (from your `Meteor.methods` definition)
      * res: *Any* (from your `Meteor.methods` definition)
    * Description:
      * Optional callback, which is called with `err` (error) and `res` (result) after the method / upload is completed
  * **progress callback**
    * Arguments:
      * total: *Number*
      * list: *[Number]*
    * Description:
      * Optional callback, which is called with the current value, each time the progress will change

### config.method

* Argument structure:
  * Your Meteor method will receive arguments in the same order as `DataSubmit.call` after the `config` argument without the callbacks

**File list arguments**

```javascript
[
  {
    name: String, // original file name
    type: String, // mime type
    size: Number, // file size in bytes
    id: String, // unique file identifier
    buffer: Uint8Array, // optional, exists only if it is not a chunk upload, to create a writable buffer: `new Buffer(...)`
  },
  ...
]
```

### config.chunkUpload

* Argument structure:
  * fileInfos
  * chunk => to create a writable buffer: `new Buffer(chunk)`

**File infos**

```javascript
{
  name: String, // original file name
  type: String, // mime type
  size: Number, // file size in bytes
  id: String, // unique file identifier
}
```

## Browser support

- Chrome 20+
- Firefox 13+
- Internet Explorer 10+
- Safari 6+
- iOS 6+
- Android 50+

## License

`meteor-data-submit` is available under the MIT license.
