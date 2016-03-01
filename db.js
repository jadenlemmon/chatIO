var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://localhost:27017/chat';

var mongo = {
    /**
     * General connect
     *
     * @param callback
     * @returns {Promise}
     * @private
     */
    _connect: function(callback) {
        return MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            return callback(err,db);
        });
    },
    /**
     * General insert
     *
     * @param data
     */
    insert: function(data) {
        this._connect(function(err, db) {
            db.collection('chat').insertOne(data, function(err, result) {
                assert.equal(err, null);
                db.close();
            });
        });
    },
    /**
     * Get's the latest public chat messages
     *
     * @param callback
     * @returns {*}
     */
    getChats: function(callback) {
        return this._connect(function(err,db) {
            return db.collection('chat').find({type: 'public'}, {limit: 30}).toArray(function(err, docs){
                db.close();
                callback(docs);
                return docs;
            });
        });
    },
    /**
     * Get's the latest private chat messages
     *
     * @param user1
     * @param user2
     * @param callback
     * @returns {*}
     */
    getPrivateChats: function(user1,user2,callback) {
        return this._connect(function(err,db) {
            return db.collection('chat').find({ $or : [ { "name" : user1 }, {"name": user2 } ], type: 'private' }, {limit: 30}).toArray(function(err, docs){
                db.close();
                callback(docs);
                return docs;
            });
        });
    }
};

module.exports = mongo;