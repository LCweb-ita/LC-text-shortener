/* ------------------------------------------------------------------------
	* LC text shortener
	* micro jQuery plugin to create excerpts on the fly, basing on fixed or container's height
	*
	* @version: 	1.01
	* @requires:	jQuery v1.5 or later
	* @author:		Luca Montanari (LCweb)
	* @website:		http://www.lcweb.it
	
	* Licensed under the MIT license
------------------------------------------------------------------------- */

(function($) {	
	$.fn.lc_txt_shortener = function(end_txt, max_height, allowed_tags) {
		var $obj = $(this);
		
		// object containing static data
		if(typeof(lcts_data) == 'undefined') {lcts_data = {};}
	
		// check ending text
		if(typeof(end_txt) == 'undefined') {end_txt = '..';}
		
		// check allowed tags 
		if(typeof(allowed_tags) == 'undefined') {allowed_tags = ['br']}
		else {
			var to_allow = ['br'];
			var allowed = ['a', 'strong', 'em', 'p'];
			var temp = allowed_tags.split(',');
			
			$.each(temp, function(i, v) {
				if($.inArray( $.trim(v), allowed) !== -1) {
					to_allow.push( $.trim(v) );	
				}
			});
			allowed_tags = to_allow;
		}


		// core
		var lcts_shorten = function(on_resize) {
			$obj.each(function() {
				var $subj = $(this);
				
				// apply parameter to store orig text in array or get the existing ID
				var uniqID = $(this).attr('lcts-id');
				
				// if is resizing - ignore detached objects
				if(typeof(on_resize) != 'undefined' && typeof(uniqID) == 'undefined') {
					return true;
				}
				
				// whether to setup or reset
				if( typeof(uniqID) == 'undefined') {	
					uniqID = Math.round(new Date().getTime() + (Math.random() * 100));
					$(this).attr('lcts-id', uniqID);
					
					lcts_data[uniqID] = {
						'orig_txt' 		: $subj.html(),
						'end_txt' 		: end_txt,
						'allowed_tags' 	: allowed_tags
					}
				}
				else {
					// reset 	
					var orig_txt = lcts_data[uniqID].orig_txt;
					$subj.html(orig_txt);
					
					$subj.removeClass('lcnb_shorten');		
				}
				
				// clean empty elements
				$subj.find('*:empty').not('br, img, i').remove();

				// current sizes
				var txt_h = $subj.outerHeight(true);
				var wrap_h = (typeof(max_height) == 'undefined' || !max_height) ? $subj.parent().height() : parseInt(max_height); // if not set max-height - use wrapper height
			
				// if is higher
				if(wrap_h < txt_h) {
					var complete_contents = $subj.html();
					$subj.addClass('lcnb_shorten');
					
					// clean attributes
					$subj.find('*').lcts_remove_all_attr();
					
					// leave only paragraphs, links, em and strong to avoid slowdowns
					$subj.find('*').not(  lcts_data[uniqID].allowed_tags.join(',')  ).each(function() {
						var content = $(this).contents();
						$(this).replaceWith(content);
					});
					
					var orig_contents = $.trim($subj.html().replace(/(\r\n|\n|\r)/gm,""));
					var exploded = orig_contents.split(' ');
					var new_contents = '';
					var right_h_txt =  '';
					
					var txt_h = 0;
					var a = 0;

					while(txt_h < wrap_h && a < exploded.length) {
						if( typeof(exploded[a]) != 'undefined') {
							right_h_txt = new_contents;
							new_contents = new_contents + exploded[a] + ' ';	

							// append and clean	
							$subj.html(new_contents + ' <span class="lcts_end_txt">'+ lcts_data[uniqID].end_txt +'</span>');	
					
							txt_h = $subj.outerHeight(true);
							a++;
						}
					}
							
					// avoid BR as last element
					if(right_h_txt.match('<br>', 'g') != null) {
						while( right_h_txt.slice(-5) == '<br>') {
							right_h_txt = $.trim(right_h_txt.slice(0, -4));	
						}
					}

					// check unclosed tags 
					var tags = lcts_data[uniqID].allowed_tags;
					$.each(tags, function(i, v) {
						
						if(v != 'br') { // not for BR
							var open_count = right_h_txt.match('<'+v, 'g');  
							var close_count = right_h_txt.match('</'+v, 'g');
							
							if(open_count != null) {
								if(open_count != null && close_count == null || open_count.length > close_count.length) {
									right_h_txt = right_h_txt + '</'+ v +'>';
								}
							}
						}
							
						if(i == (tags.length - 1)) {
							$subj.html($.trim(right_h_txt) + ' <span class="lcts_end_txt">'+ end_txt +'</span>');	
							$subj.find('*:empty').not('br').remove();
						}
					});

					// last P tag fix
					$subj.find('p').last().css('display', 'inline');
				}
			});
		}
		
		
		
		// remove all attributes from html tags
		$.fn.lcts_remove_all_attr = function() {
			return this.each(function() {
				var attributes = $.map(this.attributes, function(item) {
				  return item.name;
				});
				
				var obj = $(this);
				$.each(attributes, function(i, item) {
					if( item != "href" && item != "target") {
						obj.removeAttr(item);
					}
				});
			});
		}
		
		
		
		// shorten on resize - create event to better control
		$(window).resize(function() {
			if(typeof(lcts_debounce) != 'undefined') {clearTimeout(lcts_debounce);}
			
			lcts_debounce = setTimeout(function() {
				$obj.trigger('lcts_resize');
			}, 75);	
		});
		
		$obj.unbind('lcts_resize');
		$obj.bind('lcts_resize', function() {
			lcts_shorten(true);
		});
		
		
		
		// init
		return lcts_shorten();
	}; 
	
	
	/* destruct shortening */
	$.fn.lc_txt_unshorten = function() {
		return this.each(function() {
			var uniqID = $(this).attr('lcts-id');
			
			// if not associated - ignore
			if(typeof(uniqID) == 'undefined') {return true;}
			
			$(this).html(lcts_data[uniqID].orig_txt);
			
			$(this).unbind('lcts_resize');
			$(this).removeClass('lcnb_shorten').removeAttr('lcts-id');	
			
			lcts_data[uniqID] = false;
		});	
	}
})(jQuery);