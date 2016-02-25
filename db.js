var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://localhost:27017/chat';

var mongo = {
    _connect: function(callback) {
        return MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            return callback(err,db);
        });
    },
    insert: function(data) {
        this._connect(function(err, db) {
            db.collection('chat').insertOne(data, function(err, result) {
                assert.equal(err, null);
                db.close();
            });
        });
    },
    getChats: function(callback) {
        return this._connect(function(err,db) {
            return db.collection('chat').find({}, {limit: 30}).toArray(function(err, docs){
                db.close();
                callback(docs);
                return docs;
            });
        });
    }
};

module.exports = mongo;