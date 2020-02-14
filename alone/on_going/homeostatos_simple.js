const class_names = ["adjs_f_p", "adjs_f_s", "adjs_m_p", "adjs_m_s", "subs_f_p", "subs_f_s", "subs_m_p", "subs_m_s", 
"verbos_ger", "verbos_inf", "verbos_pr_p", "verbos_pr_s"]
const CLASSES = 1;
const COLUMNS = 2;
//--------------------------
var algorithm = COLUMNS;
var grammar = [];
var classes = [];
var word_columns = [];
var word_classes = [];
var max_words = 1;
var max_homeos = 21;



$(document).ready(function() {
	
	switch_showhide();
		
	JSZipUtils.getBinaryContent("homeostatos.zip", function(err, data) {
   	//console.log("got zip data");
      if (err) { 
      	console.log(err);
      	return; 
      }
      var zip = new JSZip(data);
      for (var i = 0; i < class_names.length; i++) {
      	classes.push(zip.file(class_names[i] + ".txt").asText().split("\n"));
      } 
	});
});

function change_max_words(num) {
	max_words = num;
}

function change_max_homeos(num) {
	max_homeos = num;
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
		$("#output").append("<BR>");
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

function homeo() {
	word_columns = [];
	word_classes = [];

	fullexp = $("#textinput").val();
	max_words = $("#max_words").val();
	max_homeos = $("#max_homeos").val();
	$("#output").html("");	
	$("#output").append(fullexp + "<BR>");
	process_in_chunks(fullexp)
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
	
	for (var i = 0; i < homeostatos.length; i++) {
		$("#output").append(homeostatos[i] + "<BR>");				
	}
}

function validate_grammar() {
	grammar = [];
	var lines = $('#grammar').val().split('\n');
	for (var i = 0; i < lines.length; i++){
		tmp_text = lines[i].trim();
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

function switch_showhide() {
	if ($('input[name=algorithm]:checked', '#form').val() == "grammar") {
		$("#lbl_max_words").hide();
		$("#max_words").hide();
		$("#lbl_grammar").show();
		$("#grammar").show();
		algorithm = CLASSES;
	}
	else {
		$("#lbl_max_words").show();
		$("#max_words").show();
		$("#lbl_grammar").hide();
		$("#grammar").hide();
		algorithm = COLUMNS;
	}
}

function work() {
	if (algorithm == CLASSES) { 
		var grammar_ok = validate_grammar();
		if (!grammar_ok) {
			alert("unknown class in grammar");
			return;	
		}
	}
	$("#info").text("working...");
	setTimeout(function(){ 
		homeo();
		if (algorithm == COLUMNS) estatos(mix_columns());
		else estatos(mix_classes())
		$("#info").text("Ready when you are");
	}, 50);	
}