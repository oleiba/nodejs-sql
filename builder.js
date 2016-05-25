var _ = require('lodash')

module.exports = {
	to_values: function (values) {
	  return '(' + values.map(this.to_value).join(', ') + ')'
	},
	to_value: function (value) {
	  return (typeof value === 'string') ? ('\'' + value + '\'') : value
	},
	// Input: seuqelize model
	to_columns_of_model: function (model, options) {
	  var columns = []
	  var table_name = model.getTableName()
	  Object.keys(model.attributes).forEach(function (attribute) {
	    if (!options || !options.exclude || options.exclude.indexOf(attribute) === -1) {
	      columns.push(table_name + '.' + to_column(attribute))
	    }
	  })
	  return columns.join(', ')
	},
	to_columns: function (attributes) {
		if (!attributes || !Array.isArray(attributes)) {
			throw new Error('attributes must be an array')
		}
	  return attributes.map(this.to_column).join(', ')
	},
	to_column: function (attribute) {
	  return '"' + attribute + '"'
	},
	to_update_string: function (update_object) {
		if (!update_object || !_.isObject(update_object)) {
			throw new Error('update_object must be an object')
		}
	  var columns = this.to_columns(Object.keys(update_object))
	  var values = this.to_values(_.values(update_object))
	  return '(' + columns + ') = ' + values
	},
	to_multi_condition_update: function (bulk) {
		var self = this
	  var table_name = bulk.table_name
	  var updates = bulk.updates
	  var attributes_to_set = {}
	  var conditions = updates.map(function (update) { return update.where })

	  updates.forEach(function (update) {
	    Object.keys(update.set).forEach(function (attribute) {
	      attributes_to_set[attribute] = attributes_to_set[attribute] || []
	      attributes_to_set[attribute].push({
	        value: update.set[attribute],
	        conditions: update.where
	      })
	    })
	  })
	  var sql_query = 'UPDATE ' + table_name + '\n'
	  sql_query += '  SET '
	  sql_query += Object.keys(attributes_to_set).map(function (attribute) {
	    var attribute_to_set_clause = self.to_column(attribute) + ' = CASE\n'
	    attributes_to_set[attribute].forEach(function (obj) {
	      attribute_to_set_clause += '    WHEN ' + self.to_condition(obj.conditions) + ' THEN ' + self.to_value(obj.value) + '\n'
	    })
	    attribute_to_set_clause += '  END'
	    return attribute_to_set_clause
	  }).join(',\n') + '\n'
	  sql_query += 'WHERE ' + self.to_conditions(conditions)
	  return sql_query
	},
	to_conditions: function (conditions) {
		var self = this
		if (!conditions || !Array.isArray(conditions)) {
			throw new Error('conditions must be an array')
		}
  	return '(' + conditions.map(function (condition) { return self.to_condition(condition) }).join(' OR ') + ')'
	},
	to_condition: function (condition) {
		var self = this
		if (!condition || !_.isObject(condition)) {
			throw new Error('condition must be an object')
		}
	  return '(' + Object.keys(condition).map(function (key) {
	    var value = self.to_value(condition[key])
	    key = self.to_column(key)
	    return key + ' = ' + value
	  }).join(' AND ') + ')'
	}
}