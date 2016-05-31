/* eslint-env mocha */
var path = require('path')
var assert = require('assert')

describe('Check SQL builder', function () {
	var options = {
		autoQuoteFieldNames: true,
		nameQuoteCharacter: '"'
	}
	var builder = require(path.join(__dirname, '../builder.js'))(options)
	it('to_value number', function (done) {
		assert.equal(builder.to_value(5), '5')
		done()
	})
	it('to_value string', function (done) {
		assert.equal(builder.to_value('foo'), '\'foo\'')
		done()
	})
	it('to_column', function (done) {
		assert.equal(builder.to_column('someColumn'), '"someColumn"')
		done()
	})
	it('to_columns', function (done) {
		assert.equal(builder.to_columns(['someColumn', 'otherColumn']), '"someColumn", "otherColumn"')
		done()
	})
	it('to_columns_of_model', function (done) {
		var model = {
			getTableName: function () { return 'someTable' },
			attributes: {someColumn: 'SMALLINT', otherColumn: 'BOOLEAN', toExcludeColumn: 'TEXT'}
		}
		assert.equal(builder.to_columns_of_model(model, {exclude: ['toExcludeColumn']}), '"someTable"."someColumn", "someTable"."otherColumn"')
		done()
	})
	it('to_update_string', function (done) {
		assert.equal(builder.to_update_string({color: 'green', age: 25}), '("color", "age") = (\'green\', 25)')
		done()
	})
	it('to_condition', function (done) {
		assert.equal(builder.to_condition({color: 'green', age: 25}), '("color" = \'green\' AND "age" = 25)')
		done()
	})
	it('to_conditions', function (done) {
		assert.equal(builder.to_conditions([{color: 'green', age: 25}, {name: 'david', id: 932}]), '(("color" = \'green\' AND "age" = 25) OR ("name" = \'david\' AND "id" = 932))')
		done()
	})
})