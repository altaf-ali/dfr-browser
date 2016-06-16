/*global VIS, view, d3 */
"use strict";

view.download = function (years, countries) {
    function debug(s) {
        console.log(new Date().toLocaleString() + ": " + s)
    }

    debug("view.download");

    function init_dropdown(selector, texts, values) {
        var options = d3.select(selector)
            .selectAll("option")
            .data(texts);

        options.enter().append("option");
        options.exit().remove();

        options.text(function (d) { return d; })
            .attr("value", function (d, i) { return values[i]; });

        var dropdown = $(selector);
        dropdown.selectize({
            maxItems: texts.length,
            plugins: ['remove_button']
        });

        dropdown[0].selectize.setValue(values);

        d3.select(selector + "_select_all")
            .on("click",function() {
                dropdown[0].selectize.setValue(values);
            });

        d3.select(selector + "_clear_all")
            .on("click",function() {
                dropdown[0].selectize.clear();
            });
    }

    function selectize_get_values(selector) {
        return $(selector)[0].selectize.getValue()
    }

    function download() {
        var years = selectize_get_values("#download_years").join();
        var countries = selectize_get_values("#download_countries").join();

        var base_url = "http://localhost/~altaf/download.php";
        var url = base_url + "?years=" + years + "&countries=" + countries;

        $.ajax({
            url: base_url,
            type: 'POST',
            success: function() {
                debug("DONE");
                window.location = 'download.php';
            }
        });
    }

    if (!VIS.ready.download) {

        //years.unshift("All years (Math.min(years))
        init_dropdown("#download_years", years, years);

        var country_codes = Object.keys(countries);
        var country_names = country_codes.map(function(k) { return countries[k]} );

        init_dropdown("#download_countries", country_names, country_codes);

        d3.select("button#download")
            .on("click",download)

        VIS.ready.download = true;
    }
    return true;
};
