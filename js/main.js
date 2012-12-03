Status = {
  INIT: '',
  CONNECTED: 'connected',
  UNAUTH: 'not_authorized',
  DISCONNECTED: 'nologin'
};

ff = {
  status: Status.INIT,
  me: {},
  page: null
};

ff.fbinit = function() {
  FB.init({
    appId      : '216347548499399',
    channelUrl : '//friendfinder.mwdesigns.com/channel.html',
    status     : true, // check login status
    cookie     : true, // enable cookies to allow the server to access the session
    xfbml      : true  // parse XFBML
  });

  ff.checkLogin();
  $('.nav a').click(ff.onNav);
};

ff.checkLogin = function() {
  FB.getLoginStatus(function(response) {
    ff.status = response.status;
    ff.statusChange();
  });
};

ff.statusChange = function() {
  if (ff.status == Status.CONNECTED) {
    _gaq.push(['_trackEvent', 'FB', 'connect-success']);
    ff.loadProfile();
  } else {
    _gaq.push(['_trackEvent', 'FB', 'connect-fail']);
    ff.navigate(Pages.Welcome);
  }
};

ff.login = function() {
  ff.showLoading();
  FB.login(function(response) {
    if (response.authResponse) {
      _gaq.push(['_trackEvent', 'FB', 'login-success']);
      ff.checkLogin();
    } else {
      ff.navigate(Pages.Welcome, false);
      if (_gaq) {
        _gaq.push(['_trackEvent', 'FB', 'login-cancel']);
      }
    }
  }, {scope: 'user_location,user_education_history,user_about_me,user_hometown,friends_location,friends_education_history,friends_about_me,friends_hometown'});
};

ff.navigate = function(page, track) {
  ff.page = page;
  page.f();
  $('.nav li').removeClass('active');
  $('#' + page.nav).addClass('active');
  $('section a').click(ff.onNav);
  if (_gaq && track) {
    _gaq.push(['_trackEvent', 'navigate', page.ref || page.t]);
  }
};

ff.loadProfile = function() {
  FB.api('/me', function(data) {
    ff.me = data;
    ff.navigate(Pages.CollegeCity);
  });
};

ff.loadFriends = function(callback) {
  FB.api('/me/friends?fields=id,name,location,education,picture', function(data) {
    ff.friends = data.data;
    callback();
  });
};

ff.getCollege = function() {
  var college = [];
  for (i in ff.me.education) {
    if (ff.me.education[i].type == "College") {
      college.push(ff.me.education[i]);
    }
  }
  if (college.length > 1) {
    return ff.selectCollege(college);
  }
  return college[0];
};

ff.selectCollege = function(college) {
  alert('You went to more than one college! Please click OK when you see the college that you want to see friends from.');
  var c;
  var i = 0;
  while (!c) {
    var thisCollege = confirm('Do you want to see friends from ' + college[i].school.name + '?');
    if (thisCollege) {
      c = college[i];
    }
    i = i + 1 >= college.length ? 0 : i + 1;
  }
  return c;
};

ff.error = function(e) {
  $('.loading').hide();
  $('section').hide();
  $('#error div p').html(e)
  $('#error').fadeIn();
};

ff.showLoading = function() {
  $('section').hide();
  $('.loading').fadeIn();
};

ff.showWelcome = function() {
  $('.loading').hide();
  $('#welcome').fadeIn();
};

ff.showCollege = function() {
  ff.showLoading();
  if (!ff.me.education) {
    ff.error('It seems we cannot access your education history. That is gonna be a problem.');
    return;
  }
  if (!ff.friends) {
    ff.loadFriends(ff.showCollege);
    return;
  }
  var college = ff.getCollege();
  var collegeFriends = [];
  for (i in ff.friends) {
    var fed = ff.friends[i].education;
    if (fed) {
      for (e in fed) {
        if (fed[e].school.id == college.school.id) {
          collegeFriends.push(ff.friends[i]);
        }
      }
    }
  }

  $('#friends').html(ff.getListHtml(collegeFriends));
  $('.loading').hide();
  $('#friends').fadeIn();
};

ff.showMyState = function() {
  ff.showLoading();
  if (!ff.me.location) {
    ff.error('It seems we cannot access your current city. That is gonna be a problem.');
    return;
  }
  if (!ff.friends) {
    ff.loadFriends(ff.showMyState);
    return;
  }
  var state = ff.me.location.name.split(',')[1].trim();
  if (!state) {
    ff.error('It seems we cannot figure our your state.');
    return;
  }
  var stateFriends = [];
  for (i in ff.friends) {
    var floc = ff.friends[i].location;
    if (floc && floc.name && floc.name.indexOf(state) >= 0) {
      stateFriends.push(ff.friends[i]);
    }
  }

  $('#friends').html(ff.getListHtml(stateFriends));
  $('.loading').hide();
  $('#friends').fadeIn();
};

ff.showMyCity = function() {
  ff.showLoading();
  if (!ff.me.location) {
    ff.error('It seems we cannot access your current city. That is gonna be a problem.');
    return;
  }
  if (!ff.friends) {
    ff.loadFriends(ff.showMyCity);
    return;
  }
  var cityFriends = [];
  for (i in ff.friends) {
    var floc = ff.friends[i].location;
    if (floc && floc.id == ff.me.location.id) {
      cityFriends.push(ff.friends[i]);
    }
  }

  $('#friends').html(ff.getListHtml(cityFriends));
  $('.loading').hide();
  $('#friends').fadeIn();
};

ff.showCollegeCity = function() {
  ff.showLoading();
  if (!ff.me.education) {
    ff.error('It seems we cannot access your education history. That is gonna be a problem.');
    return;
  }
  if (!ff.me.location) {
    ff.error('It seems we cannot access your current city. That is gonna be a problem.');
    return;
  }
  if (!ff.friends) {
    ff.loadFriends(ff.showCollegeCity);
    return;
  }
  var college = ff.getCollege();
  var ccFriends = [];
  for (i in ff.friends) {
    var floc = ff.friends[i].location;
    var fed = ff.friends[i].education;
    if (floc && fed) {
      if (floc.id == ff.me.location.id) {
        for (e in fed) {
          if (fed[e].school.id == college.school.id) {
            ccFriends.push(ff.friends[i]);
          }
        }
      }
    }
  }

  $('#friends').html(ff.getListHtml(ccFriends));
  $('.loading').hide();
  $('#friends').fadeIn();
};

ff.showCollegeState = function() {
  ff.showLoading();
  if (!ff.me.education) {
    ff.error('It seems we cannot access your education history. That is gonna be a problem.');
    return;
  }
  if (!ff.me.location) {
    ff.error('It seems we cannot access your current city. That is gonna be a problem.');
    return;
  }
  if (!ff.friends) {
    ff.loadFriends(ff.showCollegeCity);
    return;
  }
  var college = ff.getCollege();
  var state = ff.me.location.name.split(',')[1].trim();
  var ccFriends = [];
  for (i in ff.friends) {
    var floc = ff.friends[i].location;
    var fed = ff.friends[i].education;
    if (floc && fed) {
    if (floc && floc.name && floc.name.indexOf(state) >= 0) {
        for (e in fed) {
          if (fed[e].school.id == college.school.id) {
            ccFriends.push(ff.friends[i]);
          }
        }
      }
    }
  }

  $('#friends').html(ff.getListHtml(ccFriends));
  $('.loading').hide();
  $('#friends').fadeIn();
};

ff.getListHtml = function(friends) {
  if (friends.length == 0) {
    return '<div class="alert alert-block span8 offset2"><h4>Uh Oh!</h4><p>The results were rather lonely. No friends were found.</div>';
  }
  var html = '<div class="well span12"><ul>';
  for (i in friends) {
    html += '<li><a href="https://www.facebook.com/' + friends[i].id +
        '" class="name" target="_blank">' +
        '<img src="' + friends[i].picture.data.url +'">' +
        '<span class="name">' + friends[i].name + '</span></a></li>';
  }
  html += '</ul><div class="clearfix"></div></div>';
  return html;
};

ff.onNav = function(e) {
  var ref = e.target.href.split('#')[1];
  var page;
  for (i in Pages) {
    if (Pages[i].ref == ref) {
      page = Pages[i];
    }
  }
  if (page) {
    ff.navigate(page, true);
    return false;
  }
  return true;
};


Pages = {
  Home: {
    ref: '',
    t: 'home',
    f: ff.showWelcome
  },

  Welcome: {
    ref: 'welcome',
    f: ff.showWelcome
  },

  Login: {
    ref: 'login',
    f: ff.login
  },

  College: {
    ref: 'college',
    f: ff.showCollege,
    nav: 'nav-college'
  },

  City: {
    ref: 'mycity',
    f: ff.showMyCity,
    nav: 'nav-city'
  },

  State: {
    ref: 'mystate',
    f: ff.showMyState,
    nav: 'nav-state'
  },

  CollegeCity: {
    ref: 'collegecity',
    f: ff.showCollegeCity,
    nav: 'nav-cc'
  },

  CollegeState: {
    ref: 'collegestate',
    f: ff.showCollegeState,
    nav: 'nav-cs'
  },

};
