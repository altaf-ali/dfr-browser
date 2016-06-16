"use strict";

view.debates_main = function (years, docs) {
    function debug(s) {
        console.log(new Date().toLocaleString() + ": " + s)
    }

    debug("view.debates_main");

    function init_country_selector(year) {
        var countries = docs.filter(function (d) {
            return d.date.getUTCFullYear() === +year;
        });

        function on_country_change(event) {
            debug("ON COUNTRY CHANGE");
            var doc = countries[this.selectedIndex];
            debug(doc.doi);
            $.ajax({
                url : "un_debates/" + doc.doi,
                dataType: "text",
                success : function (data) {
                    $("#debate_text").text(data);
                }
            });
        }

        var options = d3.select("#debates_country")
            .on('change', on_country_change)
            .selectAll("option")
            .data(countries, function(d, i) { return d.title} );

        options.enter().append("option");
        options.exit().remove();

        options.text(function(d) { return d.title; })
            .attr("value", function(d) { return d; });
    }

    function on_year_change() {
        debug("ON YEAR CHANGE");
        init_country_selector(years[this.selectedIndex]);
    }

    if (!VIS.ready.debates_main) {

        var options = d3.select("#debates_year")
            .on('change', on_year_change)
            .selectAll("option")
            .data(years);

        options.enter().append("option");
        options.exit().remove();

        options.text(function(d) { return d; })
            .attr("value", function(d) { return d; });

        init_country_selector(years[0]);

        VIS.ready.debates_main = true;
    }
    return true;

}

view.debates_sessions = function (sessions) {
    function debug(s) {
        console.log(new Date().toLocaleString() + ": " + s)
    }

    debug("view.debates_sessions");

    var session_ids = Object.keys(sessions);

    function init_meeting_selector(session_id) {
        var meetings = sessions[session_id];

        function on_meeting_change() {
            debug("ON MEETING CHANGE");

            var pdf = sessions[session_id].files[this.selectedIndex];

            PDFObject.embed(pdf, "#sessions_pdf_container");

            //
            // "myfile.pdf", "#my-container");
            //
            // var doc = countries[this.selectedIndex];
            // debug(doc.doi);
            // $.ajax({
            //     url : "un_debates/" + doc.doi,
            //     dataType: "text",
            //     success : function (data) {
            //         $("#debate_text").text(data);
            //     }
            // });
        }

        var options = d3.select("#meeting_number")
            .on('change', on_meeting_change)
            .selectAll("option")
            .data(meetings.labels);

        options.enter().append("option");
        options.exit().remove();

        options.text(function(d, i) { return i +1; })
            .attr("value", function(d) { return d; });
    }

    function on_session_change() {
        debug("ON SESSION CHANGE");
        init_meeting_selector(session_ids[this.selectedIndex]);
    }

    if (!VIS.ready.debates_sessions) {

        var options = d3.select("#session_number")
            .on('change', on_session_change)
            .selectAll("option")
            .data(session_ids);

        options.enter().append("option");
        options.exit().remove();

        options.text(function(d, i) { return (1970-25+ (+d)) })
            .attr("value", function(d, i) { return d; });

        init_meeting_selector(session_ids[0]);

        VIS.ready.debates_sessions = true;
    }

    return true;
}


