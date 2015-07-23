$(document).on("click", ".toggle-page-frame-marks", function(){
	var $esb_frames = $(document).find(".page-annotation .esb-frame");

	$esb_frames.each(function(){
		$iframe_dom = $($(this).find("iframe")[0].contentWindow.document);
	
		if ($iframe_dom.find(".esb-mark").length > 0 && $iframe_dom.find(".esb-mark.esb-mark--is-hidden").length > 0) {
			// Show all marks
			$iframe_dom.find(".esb-mark.esb-mark--is-hidden").removeClass("esb-mark--is-hidden");
		}
		else {
			$iframe_dom.find(".esb-mark").addClass("esb-mark--is-hidden");
		}
	});
});