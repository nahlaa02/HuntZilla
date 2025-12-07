"use strict";

/* SOME CONSTANTS */
//let endpoint01 = "https://m6gwewmkf5.execute-api.us-east-1.amazonaws.com/default/project3shaferSOLVED";
let endpoint01 = "https://8ciiyg51jg.execute-api.us-east-1.amazonaws.com/default/project5mehta";

/* GAME STATE FOR TIMER + PROGRESS */
let gameTimer = null;
let gameSeconds = 0;
let q1Correct = false;
let q2Correct = false;
let q3Correct = false;

/* HELPER: update progress bar & text */
let updateProgress = () => {
    let correctCount = 0;
    if (q1Correct) correctCount++;
    if (q2Correct) correctCount++;
    if (q3Correct) correctCount++;

    let pct = (correctCount / 3) * 100;
    $("#progress-bar")
        .css("width", pct + "%")
        .attr("aria-valuenow", pct);
    $("#game-progress-text").text(`Questions solved: ${correctCount}/3`);
};

/* HELPER: start timer */
let startTimer = () => {
    if (gameTimer) clearInterval(gameTimer);
    gameSeconds = 0;
    $("#game-timer").text("Time: 0s");

    gameTimer = setInterval(() => {
        gameSeconds++;
        $("#game-timer").text(`Time: ${gameSeconds}s`);
    }, 1000);
};

/* HELPER: stop timer */
let stopTimer = () => {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
};

/* LEADERBOARD CONTROLLER */
let leaderboardController = () => {
    $.ajax({
        "url": `${endpoint01}/topleaderboard`,
        "method": "GET",
        "success": (results) => {
            $(".content-wrapper").hide();
            $("#div-leaderboard").show();
            $('#leaderboard-content').html('<div class="text-center p-5"><i class="fas fa-spinner fa-spin fa-3x"></i><p class="mt-3">Loading Leaderboard Data...</p></div>');
            console.log(results);
            let html = `
                <div class="table-responsive">
                <table class="table table-striped table-bordered table-hover align-middle mb-0 shadow">
                    <thead class="table-primary">
                        <tr class="text-center">
                            <th>Rank</th>
                            <th>Username</th>
                            <th>Seconds</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            results.forEach((row, idx) => {
                // Determine styling and trophy icon
                let rowClass = "";
                let trophyHtml = "";
                if (idx + 1 === 1) {
                    rowClass = "rank-gold";
                    trophyHtml = "<i class='fa-solid fa-trophy trophy-icon trophy-gold'></i>";
                } else if (idx + 1 === 2) {
                    rowClass = "rank-silver";
                    trophyHtml = "<i class='fa-solid fa-trophy trophy-icon trophy-silver'></i>";
                } else if (idx + 1 === 3) {
                    rowClass = "rank-bronze";
                    trophyHtml = "<i class='fa-solid fa-trophy trophy-icon trophy-bronze'></i>";
                }

                html += `
                    <tr class="text-center ${rowClass}">
                        <td><span class="badge bg-secondary">${idx + 1}</span></td>
                        <td>${trophyHtml}<span class="fw-bold">${row.username}</span></td>
                        <td><span class="text-success fw-semibold">${row.seconds}</span></td>
                    </tr>
                `;
            });
            html += `
                    </tbody>
                </table>
                </div>
            `;

            $("#leaderboard-content").html(html);
        },
        "error": (e) => {
            $("#leaderboard-error-msg").html("Could not load leaderboard.").removeClass().addClass("text-danger");
        }
    })
};

/* END GAME CONTROLLER */
let endGameController = () => {
    // Get token from localStorage
    let token = localStorage.getItem("token");
    let the_serialized_data = $.param({ token: token });

    $.ajax({
        "url": `${endpoint01}/endgame`,
        "method": "POST",
        "data": the_serialized_data,
        "complete": (results) => {
            if (results.status === 200) {
                // Stop the timer and show results
                stopTimer();

                // Populate results box with time
                let secondsText = gameSeconds === 1 ? "1 second" : `${gameSeconds} seconds`;
                $("#results-time").html(`It took you <strong>${secondsText}</strong>.`);

                $(".content-wrapper").hide();
                $("#div-confirm").show();
                $("html, body").animate({ scrollTop: "0px" });
            } else {
                $("#game_message").html("You are not done! Keep Hunting")
                    .removeClass()
                    .addClass("alert alert-danger text-center");
            }
        }
    });
};

/* GUESS 3 CONTROLLER */
let guess3Controller = () => {

    $("#msg3").html("").removeClass();

    // Get token and answer
    let token = localStorage.getItem("token");
    let guess = $("#a3").val().toLowerCase();

    if (!guess || guess.trim() === "") {
        $("#msg3").html("You must provide a valid guess before you click check").addClass("text-danger");
        return;
    }

    // Serialize as URL encoded data
    let the_serialized_data = $.param({ token: token, guess: guess });
    console.log("Sent Data: ", the_serialized_data);

    $.ajax({
        "url": `${endpoint01}/guess3`,
        "method": "PATCH",
        "data": the_serialized_data,
        "success": (results) => {
            console.log("API Results: ", results);
            if (results === "CORRECT") {
                q3Correct = true;
                updateProgress();
                $("#msg3").html(results).removeClass().addClass("text-success");
            } else {
                $("#msg3").html(results).removeClass().addClass("text-danger");
            }
        },
        "error": (e) => {
            let errorMsg = "Error checking answer.";
            if (e.responseJSON && e.responseJSON.message) {
                errorMsg = e.responseJSON.message;
            }
            $("#msg3").html(errorMsg);
        }
    });
};

let guess2Controller = () => {

    $("#msg2").html("").removeClass();

    // Get token and answer
    let token = localStorage.getItem("token");
    let guess = $("#a2").val();

    if (!guess || guess.trim() === "") {
        $("#msg2").html("You must provide a valid guess before you click check").addClass("text-danger");
        return;
    }

    // Serialize as URL encoded data
    let the_serialized_data = $.param({ token: token, guess: guess });
    console.log("Sent Data: ", the_serialized_data);

    $.ajax({
        "url": `${endpoint01}/guess2`,
        "method": "PATCH",
        "data": the_serialized_data,
        "success": (results) => {
            console.log("API Results: ", results);
            if (results === "CORRECT") {
                q2Correct = true;
                updateProgress();
                $("#msg2").html(results).removeClass().addClass("text-success");
            } else {
                $("#msg2").html(results).removeClass().addClass("text-danger");
            }
        },
        "error": (e) => {
            let errorMsg = "Error checking answer.";
            if (e.responseJSON && e.responseJSON.message) {
                errorMsg = e.responseJSON.message;
            }
            $("#msg2").html(errorMsg);
        }
    });
};

let guess1Controller = () => {

    $("#msg1").html("").removeClass();

    // Get token and answer
    let token = localStorage.getItem("token");
    let guess = $("#a1").val().toLowerCase();

    if (!guess || guess.trim() === "") {
        $("#msg1").html("You must provide a valid guess before you click check").addClass("text-danger");
        return;
    }

    // Serialize as URL encoded data
    let the_serialized_data = $.param({ token: token, guess: guess });
    console.log("Sent Data: ", the_serialized_data);

    $.ajax({
        "url": `${endpoint01}/guess1`,
        "method": "PATCH",
        "data": the_serialized_data,
        "success": (results) => {
            console.log("API Results: ", results);
            if (results === "CORRECT") {
                q1Correct = true;
                updateProgress();
                $("#msg1").html(results).removeClass().addClass("text-success");
            } else {
                $("#msg1").html(results).removeClass().addClass("text-danger");
            }
        },
        "error": (e) => {
            let errorMsg = "Error checking answer.";
            if (e.responseJSON && e.responseJSON.message) {
                errorMsg = e.responseJSON.message;
            }
            $("#msg1").html(errorMsg);
        }
    });
};

/* START GAME CONTROLLER */
let startGameController = () => {
    // Clear any previous messages
    $('#welcome_message').html("").removeClass();

    // Get token from localStorage
    let token = localStorage.getItem("token");
    if (!token) {
        $('#welcome_message').html('No token found. Please login first.')
            .addClass("alert alert-danger text-center");
        return;
    }

    let the_serialized_data = $.param({ token: token });
    console.log(the_serialized_data);

    $.ajax({
        "url": `${endpoint01}/startgame`,
        "method": "POST",
        "data": the_serialized_data,
        "success": (results) => {
            console.log(results);

            // reset progress state
            q1Correct = false;
            q2Correct = false;
            q3Correct = false;
            updateProgress();
            startTimer();

            $(".content-wrapper").hide();
            $("#div-game").show();
            $("html, body").animate({ scrollTop: "0px" });

            // Populate game content from API response
            $("#q1").html(results[0].q1);
            $("#msg1").html(results[0].msg1 || "");
            $("#a1").val("");

            $("#q2").html(results[0].q2);
            $("#msg2").html(results[0].msg2 || "");
            $("#a2").val("");

            $("#q3").html(results[0].q3);
            $("#msg3").html(results[0].msg3 || "");
            $("#a3").val("");
        },
        "error": (res) => {
            let errorMsg = "Start Game Failed. Try again.";
            if (res.responseJSON && res.responseJSON.message) {
                errorMsg = res.responseJSON.message;
            }
            $('#welcome_message').html(errorMsg).addClass("alert alert-danger text-center");
        }
    });
};

/* LOGIN CONTROLLER */
let loginController = () => {
    $('#login_message').html("").removeClass();

    let username = $("#username").val();
    let password = $("#password").val();
    if (username == "" || password == "") {
        $('#login_message').html('The user name and password are both required.')
            .addClass("alert alert-danger text-center");
        return;
    }

    let the_serialized_data = $("#form-login").serialize();
    console.log(the_serialized_data);

    $.ajax({
        "url": `${endpoint01}/login`,
        "method": "POST",
        "data": the_serialized_data,
        "success": (results) => {
            console.log(results);
            if (!results || Object.keys(results).length === 0) {
                $('#login_message').html("Login Failed. Try again.")
                    .addClass("alert alert-danger text-center");
            } else {
                // Save token for future requests
                localStorage.setItem("token", results[0].lasttoken);
                console.log(localStorage.token);
                // Hide all content wrappers and show welcome
                $(".content-wrapper").hide();
                $("#div-welcome").show();
                $("body").removeClass("login-page-bg");
                // Unlock secured content
                $(".secured").removeClass("locked");        
                $(".secured").addClass("unlocked");
            }
        },
        "error": (data) => {
            console.log(data);
            $('#login_message').html("Login Failed. Try again.")
                .addClass("alert alert-danger text-center");
        }
    });

    $("html, body").animate({ scrollTop: "0px" });
};


//document ready section
$(document).ready( () => {

    $("html, body").animate({ scrollTop: "0px" });

    /* start up navigation */
    $(".secured").removeClass("unlocked");
    $(".secured").addClass("locked");
   
    if (localStorage.token){
        $(".secured").removeClass("locked");        
        $(".secured").addClass("unlocked");
        $("body").removeClass("login-page-bg");
        $("#div-welcome").show();
    } else {
        $("#div-login").show();
        $("body").addClass("login-page-bg");
    }

    /* basic navigation */

    $('.nav-link').click( () => {
        $("html, body").animate({ scrollTop: "0px" });
        $(".navbar-collapse").collapse('hide');
    });
       
    $('#link-leaderboard').click( () => {
        stopTimer();
        leaderboardController();
    });

    $('#link-home').click( () => {
        stopTimer();
        $(".content-wrapper").hide();  
        $("#div-welcome").show();
    });

    // Start Game button
    $('#btnStartGame').click( () => {
        startGameController();
    });

    // Login button
    $('#btnLogin').click( () => {
        loginController();
    });

    // Leaderboard button on welcome
    $('#btnLeaderboard').click( () => {
        stopTimer();
        leaderboardController();
    });

    // Home button on leaderboard
    $('#btnHome').click( () => {
        stopTimer();
        $('.content-wrapper').hide();
        $('#div-welcome').show();
    });

    // Quit from in-game (no endgame call)
    $("#btnQuitGame").click( () => {
        stopTimer();
        $(".content-wrapper").hide();
        $("#div-confirm").show();
    });

    // End Game (records results)
    $("#btnEndGame").click( () => {
        endGameController();
    });

    // Check buttons
    $("#btnCheck1").click( () => {
        guess1Controller();
    });

    $("#btnCheck2").click( () => {
        guess2Controller();
    });

    $("#btnCheck3").click( () => {
        guess3Controller();
    });

    // Quit / Logout
    $('#btnQuit,#link-logout').click(() => {
        stopTimer();
        $(".content-wrapper").hide();  
        localStorage.removeItem("token");
        $("body").removeClass("login-page-bg");
        window.location = "./index.html";
    });

    $('#btnConfirmQuit').click(() => {
        stopTimer();
        $(".content-wrapper").hide();  
        localStorage.removeItem("token");
        window.location = "./index.html";
    });

    // General purpose click event to clear game_message on any button or nav link click:
    $("button, .nav-link, input[type=button]").click(function() {
        $("#game_message").html("").removeClass();
    });

    // Password visibility toggle (UPDATED aria-label here)
    $('#btnTogglePassword').click(function() {
        const passwordInput = $('#password');
        const icon = $(this).find('i');
        if (passwordInput.attr('type') === 'password') {
            passwordInput.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
            $(this).attr('aria-label', 'Hide password');
        } else {
            passwordInput.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
            $(this).attr('aria-label', 'Show password');
        }
    });

}); /* end the document ready event*/
