

/**
 * Move a block in the blocks table from one region to another via select list.
 *
 * This behavior is dependent on the tableDrag behavior, since it uses the
 * objects initialized in that behavior to update the row.
 */
Drupal.behaviors.blockDrag = function(context) {
  var table = $('table#blocks');
  if (typeof Drupal.tableDrag === 'undefined')
    return;
  var tableDrag = Drupal.tableDrag.blocks; // Get the blocks tableDrag object.

  // Add a handler for when a row is swapped, update empty regions.
  tableDrag.row.prototype.onSwap = function(swappedRow) {
    checkEmptyRegions(table, this);
  };

  // A custom message for the blocks page specifically.
  Drupal.theme.tableDragChangedWarning = function () {
    return '<div class="warning">' + Drupal.theme('tableDragChangedMarker') + ' ' + Drupal.t("The changes to these blocks will not be saved until the <em>Save</em> button is clicked.") + '</div>';
  };

  // Add a handler so when a row is dropped, update fields dropped into new regions.
  tableDrag.onDrop = function() {
    dragObject = this;
    if ($(dragObject.rowObject.element).prev('tr').is('.region-message')) {
      var regionRow = $(dragObject.rowObject.element).prev('tr').get(0);
      var regionName = regionRow.className.replace(/([^ ]+[ ]+)*region-([^ ]+)-message([ ]+[^ ]+)*/, '$2');
      var regionField = $('select.block-region-select', dragObject.rowObject.element);
      var weightField = $('select.block-weight', dragObject.rowObject.element);
      var oldRegionName = weightField[0].className.replace(/([^ ]+[ ]+)*block-weight-([^ ]+)([ ]+[^ ]+)*/, '$2');
      bat_blocks_list_type_check(dragObject.rowObject.element);
      if (!regionField.is('.block-region-'+ regionName)) {
        regionField.removeClass('block-region-' + oldRegionName).addClass('block-region-' + regionName);
        weightField.removeClass('block-weight-' + oldRegionName).addClass('block-weight-' + regionName);
        regionField.val(regionName);
      }
    }
  };

  // Add the behavior to each region select list.
  $('select.block-region-select:not(.blockregionselect-processed)', context).each(function() {
    $(this).change(function(event) {
      // Make our new row and select field.
      var row = $(this).parents('tr:first');
      var select = $(this);
      tableDrag.rowObject = new tableDrag.row(row);

      // Find the correct region and insert the row as the first in the region.
      $('tr.region-message', table).each(function() {
        if ($(this).is('.region-' + select[0].value + '-message')) {
          // Add the new row and remove the old one.
          $(this).after(row);
          // Manually update weights and restripe.
          tableDrag.updateFields(row.get(0));
          tableDrag.rowObject.changed = true;
          if (tableDrag.oldRowElement) {
            $(tableDrag.oldRowElement).removeClass('drag-previous');
          }
          tableDrag.oldRowElement = row.get(0);
          tableDrag.restripeTable();
          tableDrag.rowObject.markChanged();
          tableDrag.oldRowElement = row;
          $(row).addClass('drag-previous');
          $(row).show();
          bat_blocks_delete_init(row);
          bat_info_init(row);
          
        }
      });

      // Modify empty regions with added or removed fields.
      checkEmptyRegions(table, row);
      // Remove focus from selectbox.
      select.get(0).blur();
    });
    $(this).addClass('blockregionselect-processed');
  });

  var checkEmptyRegions = function(table, rowObject) {
    $('tr.region-message', table).each(function() {
      // If the dragged row is in this region, but above the message row, swap it down one space.
      if ($(this).prev('tr').get(0) == rowObject.element) {
        // Prevent a recursion problem when using the keyboard to move rows up.
        if ((rowObject.method != 'keyboard' || rowObject.direction == 'down')) {
          rowObject.swap('after', this);
        }
      }
      // This region has become empty
      if ($(this).next('tr').is(':not(.draggable)') || $(this).next('tr').size() == 0) {
        $(this).removeClass('region-populated').addClass('region-empty');
      }
      // This region has become populated.
      else if ($(this).is('.region-empty')) {
        $(this).removeClass('region-empty').addClass('region-populated');
      }
    });
  };
};

$().ready(function() {
  //disable already existing blocks
  $('span.block-enabled-title').each( function() {
    var block_title = this.innerHTML
    $('#bat-select-blocks').find('option').filter(function(){return $(this).html() == block_title}).attr('disabled','disabled');
  });
  
  
  $('#bat-block-add').click(
    function(e) {
      e.preventDefault();
      var text = $('#bat-select-blocks').find('option:selected').text();
      text = text.replace(/&/g,'&amp;');
      var selected_region = $('#bat-select-region').find('option:selected').val();
      if(!selected_region) {
        apprise("Please select block region");
        return;
      }  
      if(!text) {
        apprise("Please select a block");
        return;
      } 
      var selected_type = $('#bat-select-type').find('option:selected').val();
      if(text == 'Add new WYSIWYG block') {
        alert(selected_region);
        bat_block_add_wysiwyg(selected_region, selected_type);
        return;
      }
      
      
      $('span.block-disabled-title').each( function() {
        
        if(this.innerHTML == text) {
          var list_type_val = $(this).parent().next().next().next().find('select').val();
          if( list_type_val < 1 || selected_type < 1) //only affect non special blocks or special menu item that have been overridden
            $(this).parent().next().next().next().find('select').val(selected_type);
            
          $(this).parent().next().find('select').val(selected_region);
          $(this).parent().next().find('select').trigger('change');
          $('#bat-select-blocks').find('option:selected').attr('disabled','disabled').end().val(0);
          $('#bat-select-blocks').find('option:selected').removeAttr('selected');
          $('#bat-select-blocks').find('option').eq(0).attr('selected','selected');
          update_chosen();
          return false;
        }
      });      
    }
  );
  
  bat_blocks_delete_init();
  bat_info_init();
});

function bat_blocks_list_type_check(el) {
  
  if(!el)
    return;
  var val = $('.bat-block-list-type', el).find('select').val();
  var region = $('.block-region-select', el).val();
  
  if(val >= 100 && region != -1) //special menu item that have been overridden
    $('.bat-block-list-type', el).find('select').val(0);
}

function bat_blocks_delete_init(el) {
  el = el || document;
  var none = -1;
  $('.bat-block-delete', el).unbind('click');
  
  $('.bat-block-delete', el).click(function(){
    var click_el = $(this);
    var row = click_el.parent().parent();
    var block_title = click_el.parent().prev().prev().prev().find('span').get(0).innerHTML;
    var select = click_el.parent().prev().prev().find('select');
    
    var list_type = row.find('td').eq(3).find('.bat-block-list-type').find('select').val();
    
    var checkbox = '<input type="checkbox" class="bat-confirm-list-type" id="bat-check-delete" /><label for="bat-check-delete">';
    var message = "Also delete for ";    
    var delete_val = 0;
    if(list_type == 100 || list_type == 1) {
      message += "all " + content_type_friendly + "s";
      delete_val = 1;
      //hide message for non admins
      if(!block_is_admin) {
        message = "";
        checkbox = "";
      }
    } else if(list_type == 101 || list_type == 2) {
      message += " other pages with the same block";
      delete_val = 2;
    }
    
    
    //confirmation
    var add_html = "";
    if(delete_val)
      add_html = '<br/>' + checkbox + message + '</label>';
    apprise('Really delete?' + add_html, {'verify':true}, function(r, el) {
    if(r) { 
      if($('.bat-confirm-list-type', el).attr('checked')) {
        row.find('td').eq(3).find('.bat-block-list-type').find('select').val(delete_val);
        click_el.unbind('click');
      }
        
      select.val(none).trigger('change');
      row.find('span.block-enabled-title').removeClass('block-enabled-title').addClass('block-disabled-title');
      row.hide();
      $('#bat-select-blocks').find('option').filter(function(){return $(this).html() == block_title}).attr('disabled','');
      update_chosen();
    } 
    });
  });
    
    
  
}

function bat_block_add_wysiwyg(region, list_type) {
  if(!list_type)
    list_type = 0;
  var body_id = "edit-wysiwyg-body" + Number(new Date());
  var html = '<div class="node-form">   <div class="standard">       <div class="form-item" id="edit-title-wrapper">  <label for="edit-title">Title: <span class="form-required" title="This field is required.">*</span></label>  <input type="text" maxlength="255" id="edit-wysiwyg-title" size="60" value="" class="form-text required" /> </div> <div class="form-item" id="edit-field-block-admin-title-0-value-wrapper">  <label for="edit-field-block-admin-title-0-value">Administrative Title: </label>  <input type="text"  id="edit-wysiwyg-admin-title" size="60" value="" class="form-text text" /> </div> <div class="body-field-wrapper"><div class="form-item" id="edit-teaser-js-wrapper">   <label for="edit-wysiwyg-body">Body: </label>  <textarea cols="60" rows="20" id="' + body_id + '"  class="form-textarea resizable ckeditor-mod"></textarea> </div> <input type="hidden" name="format" value="2"   class="form-radio" />   </div><div class="form-item" id="edit-field-block-hide-title-value-wrapper">  <label class="option" for="edit-field-block-hide-title-value"><input type="checkbox"  id="edit-wysiwyg-hide-title" value="1"   class="form-checkbox" /> Hide Block Title</label> </div> <div class="form-item" >  <label for="edit-field-block-css-class-0-value">CSS class: </label>  <input type="text" id="edit-wysiwyg-css-class" size="60" value="" class="form-text text" />  <div class="description">Custom css class if needed</div> </div>   </div>       </div>   </div> <input type="button" name="op" id="edit-wysiwyg-submit" value="Save"  class="form-submit" /> <input type="button" name="op" id="edit-wysiwyg-cancel" value="Cancel"  class="form-submit" /> </div>';
  apprise(html);
  $('appriseOuter').css('left', '20%');
  $('.appriseOuter').css('top', '40px');
  $('.appriseOuter').css('position', 'fixed');
  $('.appriseOuter').css('z-index', '200 !important');
  $('.aButtons').remove();
  
  if(Drupal.settings.ckeditor !== undefined) {
    for(var i in  Drupal.settings.ckeditor.settings) {
      var settings = Drupal.settings.ckeditor.settings[i];
    }
    CKEDITOR.replace(body_id, settings);
  }
  
  $('.appriseOuter').css("left", ( $(window).width() - $('.appriseOuter').width() ) / 2+$(window).scrollLeft() + "px");
  
  $("#edit-wysiwyg-cancel").click(function(){
    $('.appriseOverlay').remove();
    $('.appriseOuter').remove();
  });
  
  $("#edit-wysiwyg-submit").click(function(){
    
    var checked = $("#edit-wysiwyg-hide-title").attr("checked");
    if(checked) {
      checked = 1;
    } else {
      checked = 0;
    }  
    if(typeof CKEDITOR !== 'undefined') {
      var content = CKEDITOR.instances[body_id].getData()
    } else {
      var content = $("#" + body_id).val();
    }
    alert(body_id);
    alert(content);
    $.ajax({
      url: '/bat-add-wysiwyg',
      type: 'POST',
      data: {
        content: content,
        title: $("#edit-wysiwyg-title").val(),
        admin_title: $("#edit-wysiwyg-admin-title").val(),
        hide_title: checked,
        css_class: $("#edit-wysiwyg-css-class").val(),
      },
      success: function(id) {
        alert(id);
        alert(region);
        var module = 'bats';        
        var delta = 'bat_' + id;        
        var delta_dash = delta.replace(/_/,'-');        
        var block_td = $('.bat-block-title').eq(0);
        var region_select = block_td.next().find('select');
        region_select.find('option:selected').removeAttr('selected');
        region_select.attr('name', 'bat_blocks[blocks][' + delta + '][region]');
        region_select.attr('id', 'edit-bat-blocks-blocks-' + delta_dash +  '-region');
        var weight_select = block_td.next().next().find('select');
        weight_select.find('option:selected').removeAttr('selected');
        weight_select.attr('name', 'bat_blocks[blocks][' + delta + '][weight]');
        weight_select.attr('id', 'edit-bat-blocks-blocks-' + delta_dash +  '-weight');
        var list_type_select = block_td.next().next().next().find('select');;
        list_type_select.find('option:selected').removeAttr('selected');
        list_type_select.attr('name', 'bat_blocks[blocks][' + delta + '][list_type]');
        list_type_select.attr('id', 'edit-bat-blocks-blocks-' + delta_dash +  '-list_type');
        var block_tr = '<tr   class="draggable"><td class="block bat-block-title"><span class="block-enabled-title td-replace-title"></span><div class="bat-block-list-type-info"></div></td><td class="td-replace-id"  style="display: none"><div class="form-item" id="edit-bat-blocks-blocks-bat-' + id +  '-region-wrapper"></div></td><td class="td-replace-weight" style="display: none"></td> <td><span class="bat-block-delete">Delete</span><span class="bat-block-list-type" style="display:none"></span></td> </tr>';
        block_tr = $(block_tr);
        var admin_title = $("#edit-wysiwyg-title").val();
        if( $("#edit-wysiwyg-admin-title").val()) {
          admin_title =  $("#edit-wysiwyg-admin-title").val();
        }
        block_tr.find('.td-replace-title').html(admin_title);
        block_tr.find('.td-replace-id').attr("id", "td-" + delta + "_" + module ).end();
        block_tr.find('.td-replace-id').find('div').html(region_select).end();        
        block_tr.find('.td-replace-weight').html(weight_select).end();
        block_tr.find('.bat-block-list-type').html(list_type_select).end();
        block_tr.attr("id", "td-new-" + id);
        console.log(block_tr.html());
        var tableObj = Drupal.tableDrag['blocks'];
       /*  var row = $('tr.invoice-item:last').each(
        function() {
          
          var thisrow = $(this);
          var cell = thisrow.children(':nth-child(9)');
          // Hide table body cells, but remove table header cells entirely
          // (Safari doesn't hide properly).
          cell.css('display', 'none');
        } ); */
        //add to optgroup
        $('#bat-select-blocks optgroup[label=WYSIWYG]').append('<option disabled value="' + delta +'">' +  admin_title + '</option>');
        update_chosen();
        $('.region--1-message').after(block_tr);
        tableObj.makeDraggable($("#td-new-" + id).get(0));
        alert(region);
        $("#td-new-" + id).find('.td-replace-id').find('select').val(region);
        alert($("#td-new-" + id).find('.td-replace-id').find('select').html());
        $("#td-new-" + id).find('.bat-block-list-type').find('select').val(list_type);
        $("#td-new-" + id).find('.td-replace-id').find('select').trigger('change');
        //add hidden inputs
        $('form').append('<input type="hidden" name="bat_blocks[blocks][bat_'+id+'][module]" id="edit-bat-blocks-blocks-bat-'+id+'-module" value="bat"  />');
        $('form').append('<input type="hidden" name="bat_blocks[blocks][bat_'+id+'][bid]" value="' + delta + '"  />');
        $('form').append('<input type="hidden" name="bat_blocks[blocks][bat_'+id+'][delta]" value="' + id + '"  />');
        $('.appriseOverlay').remove();
        $('.appriseOuter').remove();
        
      }
    })
  });
  
}


function bat_filter(t) {
  return $(this).html() == t;
}

function bat_info_init(el) {
  el = el || document;
  $('.bat-block-list-type-info', el).each(
    function() {
      var list_type = $(this).parent().parent().find('td').eq(3).find('.bat-block-list-type').find('select').val();
      
      if(list_type == 100)
        this.innerHTML = "Content Type block";
      else if(list_type == 101)
        this.innerHTML = "Menu children block";
      else if(list_type == 1)
        this.innerHTML = "Content Type block";
      else if(list_type == 2)
        this.innerHTML = "Menu children block";
      else if(list_type < 1)  
        this.innerHTML = "";
    }
  );
}