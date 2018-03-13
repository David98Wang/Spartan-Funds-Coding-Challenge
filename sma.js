
var data = require('./AAPL.json');
var MongoClient = require('mongodb').MongoClient;

var fs = require('fs');

var URL = 'mongodb://localhost:27017/test';  // This is the URL for MongoDb, set
                                             // variable SAVE_TO_MONGODB to true
                                             // if wish to save result to a
                                             // collection
var SAVE_TO_MONGODB = true;

/*data.sort(function(a,b){
    var dateA = new Date(a.date);
    var dateB = new Date(b.date);
    return dateA<dateB;
})*/
var ave = {openSum: 0, closeSum: 0, lowSum: 0, highSum: 0, volumeSum: 0};

var result = [];
console.log('debug');
/**
* Get the sum of the first five days
*/
for (let i = 0; i < 5; i++) {
  var cur = data[i];
  ave.openSum += cur.open;
  ave.lowSum += cur.low;
  ave.highSum += cur.high;
  ave.closeSum += cur.close;
  ave.volumeSum += cur.volume;
  console.log(ave.volumeSum);
  }
/**
 * Get the sum of the rest days by adding data for the new day and subtract data
 * from 5 days before
 */
for (let i = 5; i < data.length; i++) {
  storeMovingAverage(i - 5, ave);  // Store result into array
  var toAdd = data[i];             // new day
  var toSub = data[i - 5];         // 5 days before new day
  ave.openSum += toAdd.open - toSub.open;
  ave.closeSum += toAdd.close - toSub.close;
  ave.lowSum += toAdd.low - toSub.low;
  ave.highSum += toAdd.high - toSub.high;
  ave.volumeSum += toAdd.volume - toSub.volume;
  }
function storeMovingAverage(index, ave) {
  let curAve = JSON.parse(
      JSON.stringify(ave));         // Create a copy of current average by value
  curAve['_id'] = data[index]._id;  // Store _id and _startDate, _id correspond
                                    // to the start date id
  curAve['startDate'] = data[index].date;  // date for the first day. Assuming
                                           // the average is between day 1 and 5
                                           // (inclusive), this will be the date
                                           // of day 1
  // Divide sum by 5 to get average
  curAve.openSum /= 5.0;
  curAve.closeSum /= 5.0;
  curAve.lowSum /= 5.0;
  curAve.highSum /= 5.0;
  curAve.volumeSum /= 5.0;
  result[index] = curAve;  // Store average into array
}
/**
 * Save the result to a file called result.jsons
 */
fs.writeFile('./result.json', JSON.stringify(result), function(err) {
  if (err) {
    return console.log(err);
  }
  console.log('Result saved to \'result.json\'');
});
/**
 * Write to mongo db if SAVE_TO_MONGODB is true. 
 * Stores in "Result" collection in "Result" database.
 */
if (SAVE_TO_MONGODB) {
  // Connect to database
  MongoClient.connect(URL, function(err, db) {
    if (err) throw err;
    console.log('Database connected.');
    // Create result database if it doesn't exist
    var dbo = db.db('Result');
    // Create a new collection called 'Result'

    dbo.createCollection('Result', function(err, res) {
      if (err) throw err;
      console.log('Collection located/created');
    });
    // Remove all entires in Result collection. 
    //Otherwise I'll have to check for duplicates and the code gets messy. ¯\_(ツ)_/¯
    dbo.collection('Result').remove({});
    // Store averages to the 'Result" collection
    dbo.collection('Result').insert(result, function(err, res) {
      if (err) throw err;
      console.log('1 document inserted');
      db.close();
    });
  });
}
