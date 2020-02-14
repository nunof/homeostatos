// ******************************************************************************
// @licstart  
// The following is the entire license notice for the JavaScript code in this page.
//
//  Homeoestatos.js
//  Copyright (C) 2015  Nuno Ferreira - self@nunof.eu
//
//  The JavaScript code in this page is free software: you can
//  redistribute it and/or modify it under the terms of the GNU
//  General Public License (GNU GPL) as published by the Free Software
//  Foundation, either version 3 of the License, or (at your option)
//  any later version.  The code is distributed WITHOUT ANY WARRANTY;
//  without even the implied warranty of MERCHANTABILITY or FITNESS
//  FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
//
//  As additional permission under GNU GPL version 3 section 7, you
//  may distribute non-source (e.g., minimized or compacted) forms of
//  that code without the copy of the GNU GPL normally required by
//  section 4, provided you include this license notice and a URL
//  through which recipients can access the Corresponding Source.
//
// @licend  
// The above is the entire license notice for the JavaScript code in this page.
//
// ******************************************************************************
//
//

/*
if (typeof jQuery === "undefined") {
	//making sure that jquery is available
	var script = document.createElement('script');
	script.src = 'http://code.jquery.com/jquery-latest.min.js';
	script.type = 'text/javascript';
	document.getElementsByTagName('head')[0].appendChild(script);
}
*/

function Homeostatos(zipfile) {

	const CLASSES = 1;
	const COLUMNS = 2;
	var algorithm = null;
	var grammar = [];
	var classes = [];
	const class_names = []
	var word_columns = [];
	var word_classes = [];
	var max_words = 1;
	var max_homeos = 21;
	var homeostatos_ready = false;
	
	load_zipfile(zipfile);

	//Internal global vars serving as private storage for properties
	//var _algorithm, _algo_param
	//typeof algorithm === 'undefined' ? _algorithm = CLASSES : _algorithm = algorithm;
	//typeof algo_param === 'undefined' ? _algo_param = "" : _algorithm = algo_param;
	

	//Public properties
	/*
	Object.defineProperty(Homeostatos.prototype, "algorithm", {
		configurable: true,
		get: function() {
			return _algorithm;
		},
		set: function(newval) {
			_algorithm = newval;
		}
	});
	*/
	//Public constants	
	Homeostatos.prototype.CLASSES = 1;
	Homeostatos.prototype.COLUMNS = 2;
	
	//Public methods
	Homeostatos.prototype.set_algorithm = function(ar, itsparam1, itsparam2) {
		if (ar == CLASSES && $.type(itsparam1) === "string") {
			if (validate_grammar(itsparam1.split("\n"))) { 
				algorithm = ar;
				max_homeos = itsparam2;
				homeostatos_ready = true;
			}
			else {
				console.log("Homeostatos: invalid grammar");
				homeostatos_ready = false;
				return false;		
			}
		}
		else if (ar == COLUMNS && $.isNumeric(itsparam1)) {
			algorithm = ar;
			max_words = itsparam1;
			max_homeos = itsparam2;
			homeostatos_ready = true;
		}
		else {
			console.log("Homeostatos: invalid algorithm");
			homeostatos_ready = false;
			return false;		
		}
	}
	
	Homeostatos.prototype.generate_homeos = function(expr) {
		var res = "";
		if (!homeostatos_ready) { 
			console.log("Homeostatos: not configured yet");
			return false;	
		}
		homeo(expr);
		if (algorithm == COLUMNS) res = estatos(mix_columns());
		else if (algorithm == CLASSES) res = estatos(mix_classes())
		return res;
	};	

//private functions

function load_zipfile(zipfile) {
	
	JSZipUtils.getBinaryContent(zipfile, function(err, data) {
   	//console.log("got zip data");
      if (err) { 
      	console.log(err);
      	return; 
      }
      var zip = new JSZip(data);
      
      $.each(zip.files, function (index, zip_entry) {
      	class_names.push(zip_entry.name.substr(0, zip_entry.name.lastIndexOf('.')));
      	classes.push(zip.file(zip_entry.name).asText().split("\n"));
      });
      homeostatos_ready = true;    
	});
}

function get_white_string(size) {
	tmp = new Array(size);
	return tmp.join('&nbsp');
}

function process_in_chunks(expr) {

	var partial = "";
	var pool_size = Math.ceil(expr.length / max_words);	

	//Split the sentence in chunks and try to find words in each chunk	
	for (var chunk = 1; chunk <= max_words; chunk++) {
		if (algorithm == COLUMNS) partial = expr.substr(partial.length * (chunk - 1), pool_size);
		else partial = expr;
		//console.log(partial);
		word_columns.push([]);

		//iterate all classes	
		for (var i = 0; i < classes.length; i++) {

			//iterate classes words in class
			for (var j = 0; j < classes[i].length; j++) {
				word_classes.push([]);

				//build regex			
				var regexp = "(.*)";
				word = classes[i][j].slice(0, -1);
				for (var n = 0; n < word.length; n++) {
					regexp += "(" + word.charAt(n) + ")(.*)"; 
				}		

				//apply regex	
				res_regex = partial.match(regexp);
				if (res_regex != null) {
					found = "";

					//store a word_columns string
					for (m = 1; m < res_regex.length; m++) 
						(m % 2 == 0) ? found += res_regex[m] : found += get_white_string(res_regex[m].length+1); 

					//store word_columns strings
					tindex = chunk -1;
					word_columns[tindex].push(found);
					word_classes[i].push(found);				
				}
			}
		}
	}
	for (var l = 0; l < word_classes.length; l++) {
		word_classes[l] = word_classes[l].sort();
		word_classes[l] = word_classes[l].reverse();
	}
}

function get_random(top) {
    return Math.floor((Math.random() * top)); 
}

function homeo(expr) {
	word_columns = [];
	word_classes = [];
	process_in_chunks(expr);
}
  
function mix_columns() {
	var homeostatos = [];
	//iterate through matched words	
	for (var i = 0; i < word_columns[0].length; i++) {
		var tmp_line = "";
		//build line from number of words
		for (var j = 0; j < word_columns.length; j++) {
			tmp_line += word_columns[j][get_random(word_columns[j].length)];
		}
		homeostatos.push(tmp_line);
		if (i >= max_homeos) break;
	}
	return homeostatos;
}

function mix_classes() {
	var homeostatos = [];
	var effective_grammar = get_effective_grammar();
	var counter = 0;
	while (++counter < max_homeos) {
		for (var i = 0; i < effective_grammar.length; i++) {
			var tmp_line = "";
			for (var j = 0; j < effective_grammar[i].length; j++) {
				tmp_line += word_classes[effective_grammar[i][j]][get_random(word_classes[effective_grammar[i][j]].length)] + "<br>";
			}
			homeostatos.push(tmp_line);
		}
	}
	return homeostatos;
} 

function get_effective_grammar() {
	var effective_grammar = [];
	for (var i = 0; i < grammar.length; i++) {
		var test = true;
		for (j = 0; j < grammar[i].length; j++) {
			if (word_classes[grammar[i][j]].length == 0) {
				test = false;
				break;			
			}
		}
		if (test) effective_grammar.push(grammar[i]);
	}
	return effective_grammar;
} 

function estatos(homeostatos) {
	var result = "";
	for (var i = 0; i < homeostatos.length; i++) {
		result += homeostatos[i] + "<BR>";				
	}
	return result;
}

function validate_grammar(new_grammar) {
	grammar = [];
	for (var i = 0; i < new_grammar.length; i++){
		tmp_text = new_grammar[i].trim();
		if (tmp_text.length > 0) {
			grammar.push([]);
			tmp_classes = tmp_text.split(",");
			for (var j = 0; j < tmp_classes.length; j++) {
				tmp_class = tmp_classes[j].trim();
				tindex = class_names.indexOf(tmp_class); 
				if (tindex != -1) grammar[i].push(tindex);
				else return false;
			}
		}
	}
	return true;
}

};