var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function() {
        window.deviceReady = true;
        document.addEventListener("resume", this.onResume, false);
        document.addEventListener("pause", this.onPause, false);
        document.addEventListener("backbutton", this.pressBackButton, false);

        var connection = app.checkConnection('deviceready');
        alert(connection);
    },
    checkConnection: function(id) {
        /* check for connection type */
        var networkState = navigator.connection.type, states = {};
        states[Connection.UNKNOWN] = 'Unknown';
        states[Connection.ETHERNET] = 'Ethernet';
        states[Connection.WIFI] = 'WiFi';
        states[Connection.CELL_2G] = '2G';
        states[Connection.CELL_3G] = '3G';
        states[Connection.CELL_4G] = '4G';
        states[Connection.NONE] = 'None';
        return states[networkState];
    },
    onResume: function() {
        /* this function is runned when the device comes back from a resume state */
        showAlert('onResume', '');
    },
    onPause: function() {
        /* this function is runned when the device comes back from a pause state */
        showAlert('onPause', '');
    },
    pressBackButton: function() {
        /* this function is runned when the back button has been pressed */
        showAlert('pressBackButton', '');
    }
};

/* fast click, for removing the 300 milisecinds delay */
$(function() {
    FastClick.attach(document.body);
});

/* replace the value with the path to your backend api */
var rest = 'http://sex.123easywebsites.com/rest/';

$(document).on('pageshow', '#index-page', function() {
    var loggedIn = window.localStorage.getItem("logged_in");

    $('#login_button').on('click', function(e) {
        if (loggedIn) {
            alert('You are already logged in');
            e.preventDefault();
        }
    });

    $('#register_button').on('click', function(e) {
        if (loggedIn) {
            alert('Can\'t register. You are already logged in');
            e.preventDefault();
        }
    });

    $('#logout_button').on('click', function(e) {
        if (!loggedIn) {
            alert('You are already logged out');
            e.preventDefault();
        } else {
            clearInitialValues();
            alert('data cleared');
        }
    });

});

/* once the user is logged in, set the values in localhost for easy use, simulates session */
$(document).on('pageshow', '#main-page', function() {
    $('.loggedin_logged_in').html(window.localStorage.getItem("logged_in"));
    $('.loggedin_user_id').html(window.localStorage.getItem("user_id"));
    $('.loggedin_name').html(window.localStorage.getItem("name"));
    $('.loggedin_email').html(window.localStorage.getItem("email"));
    $('.loggedin_created_day').html(window.localStorage.getItem("created_day"));
    $('.loggedin_created_month').html(window.localStorage.getItem("created_month"));
    $('.loggedin_created_year').html(window.localStorage.getItem("created_year"));
});


$(document).on('pageinit', '#login-page', function() {
    parseForm();
});

$(document).on('pageinit', '#register-page', function() {
    parseForm();
});

function parseForm() {
    /**
     * login form
     */
    $('#login_submit').on('click', function(e) {
        e.preventDefault();

        $.mobile.loading("show");

        var loginForm = $('#login_form').serializeArray();

        if (validateForms('login')) {  /* make sure the form is valid */
            $.when(sendAjax(loginForm, 'login')).then(function(data) {
                console.log(data);

                $.mobile.loading("hide");

                /* the 'fail' value is returned from the backend api when the login fails*/
                /* it can be replaced by another value or a bool */
                if (data === 'fail') {
                    showAlert('Wrong username or password. Please try again', '');
                }
                else if (data.id != null) {
                    /* if there is a user id returned, the logged in was a success */
                    /* save the values in localstorage*/
                    setInitialValues(data);
                    $.mobile.pageContainer.pagecontainer("change", "index.html", {reloadPage: true});
                }
                else {
                    /* show an message if the server wasnt reached, or other errors */
                    showAlert('There was a problen with our system. We are on it!', '');
                }
            });
        }
    });

    /**
     * register form
     */
    $('#register_submit').on('click', function(e) {
        e.preventDefault();

        $.mobile.loading("show");

        var registerForm = $('#register_form').serializeArray();

        if (validateForms('register')) { /* make sure the form is valid */
            $.when(sendAjax(registerForm, 'register')).then(function(data) {
                console.log(data);

                $.mobile.loading("hide");

                /* the 'duplicate_email' value is returned from the backend api when there is a duplicate email*/
                /* it can be replaced by another value or a bool */
                if (data === 'duplicate_email') {
                    showAlert('This email already exists. Please choose another one', '');
                    return false;
                }
                else {
                    showAlert('Registration is successful', '');
                    $.mobile.pageContainer.pagecontainer("change", "index.html", {reloadPage: true});
                }
            });
        }
    });
}

function validateForms(name) {
    /* validate the login form */
    if (name == 'login') {
        var loginEmail = $('#login_email').val();
        var loginPass = $('#login_password').val();
        if (loginEmail === '') {
            showAlert('Email is empty.', '');
            return false;
        }
        if (VALIDATORS.isValidEmailAddress(loginEmail) === false) {
            showAlert('Email is not valid.', '');
            return false;
        }
        if (loginPass === '') {
            showAlert('Please enter a password', '');
            return false;
        }
    }

    /* validate the registration form */
    if (name == 'register') {
        var registerEmail = $('#register_email').val();
        var registerName = $('#register_name').val();
        var registerPass = $('#register_password').val();
        var registerPassValid = $('#register_password_validate').val();
        if (registerEmail === '') {
            showAlert('Email is empty.', '');
            return false;
        }
        if (VALIDATORS.isValidEmailAddress(registerEmail) === false) {
            showAlert('Email is not valid.', '');
            return false;
        }
        if (registerName === '') {
            showAlert('Please enter your name', '');
            return false;
        }
        if (registerName.length < 3) {
            showAlert('Name must be at least 4 characters long', '');
            return false;
        }
        if (registerPass === '') {
            showAlert('Please enter a password', '');
            return false;
        }
        if (registerPass.length < 3) {
            showAlert('Password must be at least 4 characters long', '');
            return false;
        }
        if (registerPassValid === '') {
            showAlert('Please verify password', '');
            return false;
        }
        if (registerPass !== registerPassValid) {
            showAlert('Password must match', '');
            return false;
        }
    }

    return true;
}

/* generic ajax method */
function sendAjax(data, type) {
    return $.ajax({
        type: "GET",
        dataType: "jsonp",
        url: rest + type,
        data: data
    });
}

function setInitialValues(data) {
    window.localStorage.setItem("logged_in", 1);
    window.localStorage.setItem("user_id", data.id);
    window.localStorage.setItem("name", data.name);
    window.localStorage.setItem("email", data.email);
    window.localStorage.setItem("created_day", data.created.mday);
    window.localStorage.setItem("created_month", data.created.mon);
    window.localStorage.setItem("created_year", data.created.year);
}


function clearInitialValues(data) {
    window.localStorage.removeItem("logged_in");
    window.localStorage.removeItem("user_id");
    window.localStorage.removeItem("name");
    window.localStorage.removeItem("email");
    window.localStorage.removeItem("created_day");
    window.localStorage.removeItem("created_month");
    window.localStorage.removeItem("created_year");
}

function showAlert(message, title) {
    /* TODO remove alert and enable navigator, this is used for local testing */
    //navigator.notification.alert(message, null, title, 'Ok');
    alert(title ? (title + ": " + message) : message);
}
