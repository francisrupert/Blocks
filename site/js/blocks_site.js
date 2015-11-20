$(document).ready(function(){
	$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
	  $(e.target).siblings('a').removeClass("active");
	  $(e.target).addClass("active");
	});
});