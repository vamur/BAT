<?php

/**
 * @file
 * Default theme implementation to configure blocks.
 *
 * Available variables:
 * - $block_regions: An array of regions. Keyed by name with the title as value.
 * - $block_listing: An array of blocks keyed by region and then delta.
 * - $form_closure: All not yet rendered form elements.
 *
 * Each $block_listing[$region] contains an array of blocks for that region.
 *
 * Each $data in $block_listing[$region] contains:
 * - $data->region_title: Region title for the listed block.
 * - $data->block_title: Block title.
 * - $data->region_select: Drop-down menu for assigning a region.
 * - $data->weight_select: Drop-down menu for setting weights.
 *
 * @see template_preprocess_node_level_blocks_fieldset()
 */
 
 $bat_groups = array() ;
 if(count($bat)) {
   foreach($bat as $delta => $block) {
     $bat_groups[$block->module][] = $block;
   }
 }
 
?>
<?php
  // Add table javascript.
  drupal_add_js('misc/tableheader.js');
  
  foreach ($block_regions as $region => $title) {
    drupal_add_tabledrag('blocks', 'match', 'sibling', 'block-region-select', 'block-region-'. $region, NULL, FALSE);
    drupal_add_tabledrag('blocks', 'order', 'sibling', 'block-weight', 'block-weight-'. $region);
  }
?>
<style>
  .bat-block-delete{
    cursor: pointer;
  }
</style>
<?php if(user_access('administer bat')) { ?>
  <script>
    var block_is_admin = true;
  </script>  
<?php } else { ?>
<script>
  var block_is_admin = false;
</script>  
<?php } ?>
<div id="bat-select" style="padding-bottom: 10px">
  <select id="bat-select-blocks">
    <option value="">Please select a block</option>
    <option value="new-wysiwyg">Add new WYSIWYG block</option>
    
    <?php foreach ($bat_groups as $module_label => $hms_group_blocks) { ?>    
      <?php 
          if (!$previous_module or $previous_module != $module_label) {
            if($previous_module) {
              print "</optgroup>";
            }
            $previous_module = $module_label;
            $label = $module_label;
            if($label == 'bat') {
              $label = 'WYSIWYG';
            }
            if($label == 'menu_block') {
              $label = 'Left menu';
            }
            if($label == 'views') {
              $label = 'Featured';
            }
            if($label == 'hms_block') {
              $label = 'Banners';
            }
            if($label == 'cck_blocks') {
              $label = 'Fields';
            }
            print('<optgroup label="' . $label . '">');
          } 
        ?>
      <?php foreach ($hms_group_blocks as $delta => $data): ?>
        
        <option value="<?php print $data->block_bid ?>"><?php print $data->block_title ?></option>
      <?php endforeach; ?>
    <?php } ?>
  </select>
  <select id="bat-select-region">
    <option value="">Please select block region</option>
    <?php foreach ($block_regions as $region => $title): ?>
      <?php 
        $hide = '';
        
        if($region == BLOCK_REGION_NONE) {
          $hide = 'style="display: none"';
          $class_disabled = 'block-disabled-title';
          continue;
        } 
        if($region == "node_top") {
          $hide = 'style="display: none"';
          continue;
        }  
      
      ?>
      <option value="<?php print $region?>"><?php print $title; ?></option>
    <?php endforeach; ?>  
  </select>
  <select id="bat-select-type">
    <option value="">For this <?php print $content_type_friendly ?> only</option>
    <?php if(user_access('administer bat')) { ?>
      <option value="1">For all <?php print  $content_type_friendly ?>s</option>
    <?php } ?>
    <option value="2">For menu children of this <?php print $content_type_friendly ?></option>
  </select>
  <script>
    var content_type_friendly = '<?php print  $content_type_friendly ?>';
  </script>

  <a href="" id="bat-block-add" class="button">Add Block</a>
</div>

<table id="blocks" class="sticky-enabled">
  <thead>
    <tr>
      <th><?php print t('Block'); ?></th>
      <th style="display: none"><?php print t('Region'); ?></th>
      <th style="display: none"><?php print t('Weight'); ?></th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <?php $row = 0; ?>
    <?php foreach ($block_regions as $region => $title): ?>
      <?php 
        $hide = '';
        $class_disabled = 'block-enabled-title';
        if($region == BLOCK_REGION_NONE) {
          $hide = 'style="display: none"';
          $class_disabled = 'block-disabled-title';
        }  
        //hide note_top as it doesn't seem to be used
        if($region == "node_top") {
          $hide = 'style="display: none"';
          continue;
        }
      
      ?>
      <tr <?php print($hide) ?> class="region region-<?php print $region?>">
        <td colspan="5" class="region"><?php print $title; ?></td>
      </tr>
      <tr <?php print($hide) ?> class="region-message region-<?php print $region?>-message <?php print empty($block_listing[$region]) ? 'region-empty' : 'region-populated'; ?>">
        <td colspan="5"><em><?php print t('No blocks in this region'); ?></em></td>
      </tr>
      <?php foreach ($block_listing[$region] as $delta => $data): ?>
      <tr <?php print($hide) ?> class="draggable <?php print $row % 2 == 0 ? 'odd' : 'even'; ?><?php print $data->row_class ? ' '. $data->row_class : ''; ?>">
        <td class="block bat-block-title"><span class="<?php print $class_disabled ?>"><?php print $data->block_title; ?></span><div class="bat-block-list-type-info"></div></td>
        <td id="td-<?php print($delta . '-' . $data->module)?>" <?php print($hide) ?>  style="display: none">
          <?php print $data->region_select; ?>
                    
        </td>
        <td><?php print $data->weight_select; ?></td>
        <td><?php if(!$data->admin_block) { ?><span class="bat-block-delete">Delete</span><?php } ?><span class="bat-block-list-type" style="display:none"><?php print $data->list_type_select; ?></span></td>
      </tr>
      <?php $row++; ?>
      <?php endforeach; ?>
    <?php endforeach; ?>
  </tbody>
</table>
<link type="text/css" rel="stylesheet" media="all" href="/sites/all/modules/bat/js/chosen.css" /> 
<script>
var jQuery_old = $;
$.getScript("https://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js",
function() {
  jQuery_new = $; 
  $ = jQuery_old;
  jQuery = jQuery_old;
  (function($){
    var jQuery = jQuery_new;
    jQuery.ajax({
      url: "/sites/all/modules/bat/js/chosen.jquery.min.js", 
      success: function(d) {
        eval(d);
        jQuery("#bat-select-blocks").chosen();
        window.jQuery14 = jQuery;
        window.update_chosen = function() {
          jQuery14("#bat-select-blocks").trigger("liszt:updated");
        }
    }
    });
  })(jQuery_new)
  
});

</script>
<?php
print $form_submit;
