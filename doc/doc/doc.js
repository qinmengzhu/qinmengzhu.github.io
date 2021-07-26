(function($){
    "use strict";

    
    $(document).ready(function(){

        $('body').find('pre').each(function(){
            $(this).addClass('prettyprint');
        });
        prettyPrint();
        

        var build_grid = function(){
            $('.doc-custom-style').each(function(){ $(this).remove(); });

            var $grid = $('#builder_grid');
            var gid = $grid.attr('id');
            var data = $('#builder_data').text();
            var json = $.parseJSON(data);
            var per_page = typeof($grid.data('pager'))!=='undefined' && parseInt($grid.data('pager'))>0 ? parseInt($grid.data('pager')) : 20;

            var item_style = $grid.data('item-style');
            var open_state = $grid.data('open-state');

            if( $grid.hasClass('grid-x') ){
                var s_w = parseInt($grid.data('size-width'));
                var s_h = parseInt($grid.data('size-height'));
                var s_g = parseInt($grid.data('size-gutter'));
                s_g = s_g%2==0 ? s_g : parseInt(s_g/2)*2;

                if( s_w>0 && s_h>0 && s_g>-1 ){
                    var g_cols = parseInt($grid.width()/(s_w+s_g));
                    $grid.find('.grid-viewport').width(g_cols*(s_w+s_g));
                    var g_vml = ($grid.width()-$grid.find('.grid-viewport').width())/2-s_g/2;
                    $grid.find('.grid-viewport').css('margin-left', g_vml+'px');
                    var gstyle = '<style type="text/css" class="doc-custom-style"> \
                                    #'+gid+' { padding-left:'+(s_g/2)+'px; padding-right:'+(s_g/2)+'px; } \
                                    #'+gid+' .grid-viewport{ margin-left: -'+(s_g/2)+'px; margin-right: -'+(s_g/2)+'px;} \
                                    #'+gid+' .grid-item{ width:'+s_w+'px; margin-left:'+(s_g/2)+'px; margin-right:'+(s_g/2)+'px; margin-bottom:'+s_g+'px; } \
                                    #'+gid+' .grid-item.horizontal{ width:'+(s_w*2+s_g)+'px; } \
                                    #'+gid+' .grid-item.vertical{ width:'+s_w+'px; } \
                                    #'+gid+' .grid-item.large{ width:'+(s_w*2+s_g)+'px; } \
                                    #'+gid+' .grid-item:not(.opened){ height:'+s_h+'px; } \
                                    #'+gid+' .grid-item.horizontal:not(.opened){ height:'+s_h+'px; } \
                                    #'+gid+' .grid-item.vertical:not(.opened){ height:'+(s_h*2+s_g)+'px; } \
                                    #'+gid+' .grid-item.large:not(.opened){ height:'+(s_h*2+s_g)+'px; } \
                                    #'+gid+' .grid-item.opened{ width:'+(s_w*3+s_g*2)+'px; min-height:'+(s_h*2+s_g)+'px; } \
                                    #'+gid+' .grid-item.opened .expanded{ min-height:'+(s_h*2+s_g)+'px; } \
                                  </style>';
                    $('head').append(gstyle);
                }
            }
            else if( $grid.hasClass('grid-masonry') ){
                var col = parseInt($grid.data('column'));
                var gut = parseInt($grid.data('size-gutter'));
                gut = gut%2==0 ? gut : parseInt(gut/2)*2;

                if( col>0 && gut>-1 ){
                    var w_p = 100/col;
                    var row_margin = gut/2;
                    var gstyle = '<style type="text/css" class="doc-custom-style"> \
                                    #'+gid+' { padding-left:'+gut+'px; padding-right:'+gut+'px; } \
                                    #'+gid+' .grid-viewport{ margin-left: -'+row_margin+'px; margin-right: -'+row_margin+'px;} \
                                    #'+gid+' .grid-item{ width:'+w_p+'%; padding-left:'+gut/2+'px; padding-right:'+gut/2+'px; margin-bottom:'+gut+'px; float:left; } \
                                  </style>';
                    $('head').append(gstyle);
                }
            }
            else if( $grid.hasClass('grid-style') ){
                var col = parseInt($grid.data('column'));
                var gut = parseInt($grid.data('size-gutter'));
                gut = gut%2==0 ? gut : parseInt(gut/2)*2;

                if( col>0 && gut>-1 ){
                    var w_p = 100/col;
                    var row_margin = gut/2==0 ? 1 : gut/2;
                    var gstyle = '<style type="text/css" class="doc-custom-style"> \
                                    #'+gid+' { padding-left:'+gut+'px; padding-right:'+gut+'px; } \
                                    #'+gid+' .grid-viewport{ margin-left:-'+row_margin+'px; margin-right:-'+row_margin+'px; } \
                                    #'+gid+' .grid-item{ width:'+w_p+'%; padding-left:'+gut/2+'px; padding-right:'+gut/2+'px; margin-bottom:'+gut+'px; } \
                                  </style>';
                    $('head').append(gstyle);
                }
            }

            if( typeof json.posts!=='undefined' ){
                var postsCollection = new GX.Collections.Posts(json.posts);
                var paginated = new PaginatedCollection(postsCollection, { perPage: per_page });
                var args = { collection: paginated, 
                             el:$grid.find('.grid-viewport'),
                             open_state: open_state,
                             item_style: item_style };

                var postsView = null;
                if( $grid.hasClass('grid-masonry') ){
                    postsView = new GX.Views.GridMasonry(args);
                }
                else if( $grid.hasClass('grid-style') ){
                    postsView = new GX.Views.GridStyle(args);
                }
                else{
                    postsView = new GX.Views.GridX(args);
                }

                $grid.find('.grid-viewport').replaceWith( postsView.render().el );
                $grid.append('<div class="clearfix"></div>');

                var $html_div = $('<div>');
                postsView.collection.each(function(_model){
                    var pv = new GX.Views.Post({ model: _model, tpl:item_style });
                    $html_div.append(pv.render().el);
                    $html_div.append('\n')
                });

                var coll = new GX.Collections.Posts();
                postsView.collection.each(function(_model){
                    var gs = _model.get('grid_size').split(' ');
                    _model.set('grid_size', gs[0]);
                    _model.set('content', '');
                    _model.unset('post_type');
                    _model.unset('tags');
                    _model.unset('tpl_style');
                    coll.add( _model );
                });

                $('#builder_result').val( $('#builder_result').val().replace('...', '\n'+$html_div.html()) );
                $('#builder_result_json').val( $('#builder_result_json').val().replace('...', JSON.stringify({posts:coll.toJSON()}, null, '    ')) );
            }
        };

        $('#b_layout_x').on('click', function(){
            $('.b_control_g, .b_control_m').each(function(){ $(this).hide(); });
            $('.b_control_x').each(function(){ $(this).show(); });
        });

        $('#b_layout_g').on('click', function(){
            $('.b_control_x, .b_control_m').each(function(){ $(this).hide(); });
            $('.b_control_g').each(function(){ $(this).show(); });
        });

        $('#b_layout_m').on('click', function(){
            $('.b_control_x, .b_control_g').each(function(){ $(this).hide(); });
            $('.b_control_m').each(function(){ $(this).show(); });
        });

        
        $('#b_build').on('click', function(){
            var layout = $('input[name="b_layout"]:checked').val();
            var attrs = '';
            if( layout=='x' ){
                attrs += 'data-item-style="'+$('#b_style_g').val()+'"';
                attrs += ' data-size-width="'+parseInt($('#b_size_w').val())+'"';
                attrs += ' data-size-height="'+parseInt($('#b_size_h').val())+'"';
                attrs += ' data-open-state="'+$('#b_open_x').val()+'"';
                attrs += ' data-size-gutter="'+parseInt($('#b_gutter').val())+'"';
            }
            else if( layout=='style' ){
                attrs += 'data-item-style="'+$('#b_style_g').val()+'"';
                attrs += ' data-item-size="'+$('#b_size_g').val()+'"';
                attrs += ' data-column="'+$('#b_column').val()+'"'
                attrs += ' data-open-state="'+$('#b_open_g').val()+'"';
                attrs += ' data-size-gutter="'+parseInt($('#b_gutter').val())+'"';
            }
            else{
                attrs += 'data-item-style="'+$('#b_style_m').val()+'"';
                attrs += ' data-column="'+$('#b_column').val()+'"'
                attrs += ' data-open-state="'+$('#b_open_g').val()+'"';
                attrs += ' data-size-gutter="'+parseInt($('#b_gutter').val())+'"';
            }
            
            attrs += ' data-pager="6"';

            var tpl_name = layout=='x' || layout=='style' ? $('#b_style_g').val() : $('#b_style_m').val();
            var tpl_code = $('#'+tpl_name).html();
            tpl_code = '<script type="text/template" id="'+tpl_name+'">' + tpl_code + '</script>';

            $('#builder_preview').html('<div id="builder_grid" class="grid-container grid-'+layout+'" '+attrs+'><div class="grid-viewport row"></div></div>');
            $('#builder_result').val('<div id="grid_layout_id" class="grid-container grid-'+layout+'" '+attrs+'>\n    <div class="grid-viewport row">...</div>\n    <script type="text/template" class="grid-data"></script>\n</div>');
            $('#builder_result_json').val('<div id="grid_layout_id" class="grid-container grid-'+layout+'" '+attrs+'>\n    <div class="grid-viewport row"></div>\n    <script type="text/template" class="grid-data">...</script>\n</div>\n\n'+tpl_code);

            build_grid();

            $(this).addClass('disabled');
        });

        $('#b_build').trigger('click');

        $('#builder_form').find('input,select').on('change', function(){
            $('#b_build').removeClass('disabled');
        });


    });


})(jQuery);