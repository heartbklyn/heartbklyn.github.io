jQuery('.primary-nav__content .primary-nav__right .mobilemenu').on('click', function(event) {
	event.preventDefault();
	jQuery(this).toggleClass('active');
	jQuery('.primary-nav__content .primary-nav__right .menubar').slideToggle();
});
jQuery(window).on('load', function(e) {
	setTimeout(function () {
		jQuery('.banner-box').removeClass('hideit');
	 }, 2000);
});

jQuery('.banner-box .text a.readstory').on('click', function(event) {
	event.preventDefault();
});
jQuery('.videoslider').slick({
  infinite: false,
  dots: true,
  fade: true,
  slidesToShow: 1,
});
jQuery('.videoslider').on('afterChange', function (event, slick, currentSlide) {
  	console.log('afterChange, currentSlide: ', currentSlide);
	var currslide = currentSlide;
	if(currslide == 0) {
		jQuery('.videosliderbg').addClass('firstslide');
	} else {
		jQuery('.videosliderbg').removeClass('firstslide');
	}
	if(currslide == 15) {
		jQuery('.banner-box').addClass('finalslide');
		//jQuery('.banner-box .slick-next').text('The End');
	} else {
		jQuery('.banner-box').removeClass('finalslide');
		//jQuery('.banner-box .slick-next').text('Next');
	}
});
jQuery('.banner-box .text a.readstory').click(function(e) {
	e.preventDefault();
	jQuery('.videoslider').slick('slickGoTo', 1);
});

window.onload = function onLoad() {
  var progressBar = 
    new ProgressBar.Circle('#progress', {
      color: '#0092BC',
      strokeWidth: 10,
      duration: 2000, // milliseconds
      easing: 'easeInOut'
    });

  progressBar.animate(1); // percent
};