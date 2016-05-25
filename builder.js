module.exports = {
	to_values: function (values) {
	  return '(' + values.map(to_sql_value).join(', ') + ')'
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
	      columns.push(table_name + '.' + to_sql_column(attribute))
	    }
	  })
	  return columns.join(', ')
	},
	to_columns: function (attributes) {
	  return attributes.map(to_sql_column).join(', ')
	},
	to_column: function (attribute) {
	  return '"' + attribute + '"'
	},
	to_update_string: function (obj) {
	  var columns = to_sql_columns(Object.keys(obj))
	  var values = to_sql_values(_.values(obj))
	  return '(' + columns + ') = ' + values
	},
	to_multi_condition_update: function (bulk) {
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
	    var attribute_to_set_clause = sql_builder.to_sql_column(attribute) + ' = CASE\n'
	    attributes_to_set[attribute].forEach(function (obj) {
	      attribute_to_set_clause += '    WHEN ' + to_sql_condition(obj.conditions) + ' THEN ' + sql_builder.to_value(obj.value) + '\n'
	    })
	    attribute_to_set_clause += '  END'
	    return attribute_to_set_clause
	  }).join(',\n') + '\n'
	  sql_query += 'WHERE ' + to_sql_conditions(conditions)
	  return sql_query
	},
	to_conditions = function (conditions) {
  	return '(' + conditions.map(to_sql_condition).join(' OR ') + ')'
	}
	to_condition: function (where_obj) {
	  return '(' + Object.keys(where_obj).map(function (key) {
	    var value = sql_builder.to_value(where_obj[key])
	    key = sql_builder.to_sql_column(key)
	    return key + ' = ' + value
	  }).join(' AND ') + ')'
	}
}