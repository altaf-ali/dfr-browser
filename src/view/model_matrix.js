"use strict";

view.model.matrix = function(args) {
    var timer_interval = 500;

    function debug(s) {
        console.log(new Date().toLocaleString() + ": " + s)
    }
    debug("view.model.matrix: year = " + args.year + ", docs = " + args.docs.length);

    var country_codes = Object.keys(args.countries);
    var countries = country_codes.map(function(k) { return args.countries[k]} );
    var country_index = {}

    for (var i = 0; i < countries.length; i += 1) {
        country_index[country_codes[i]] = i
    }

    var spec = VIS.model_view.matrix.body;
    var svg_header = view.plot_svg("#model_view_matrix_header", VIS.model_view.matrix.header);
    var svg_body = view.plot_svg("#model_view_matrix_grid", spec);

    var layout = {
        margins: {
            top: 45,
            left: 275,
            right: 35
        },
        padding: {
            left: 10,
            bottom: 5
        }
    };

    // view.dfb().set_view("/model/matrix/" + args.year);

    var year_label = d3.select("#model_view_matrix_controls #status-control #year");
    year_label.text(Math.round(args.year))

    function update_matrix(year) {
        view.dfb().model_view_matrix(Math.round(year));
    }

    function add_slider(start_date, end_date) {

        var date_range = d3.scale.linear()
            .domain([start_date, end_date]);

        var axis = d3.svg.axis()
            .tickValues(d3.range(start_date, end_date +1).filter(function(d, i) {
                return (d == start_date || d == end_date || !(d % 5));
            }))
            .tickFormat(d3.format("04d"))
            .tickSize(7);

        var slider = d3.slider()
            .scale(date_range)
            .axis(axis)
            .on("slide", function(event, value) { update_matrix(value); })
            .value(start_date);

        d3.select("#model_view_matrix_controls #slider-control")
            .call(slider);

        function toggle_animation() {
            var title = "Play";

            if (VIS.last.matrix.playing) {
                clearInterval(VIS.last.matrix.timer_id)
            } else {
                title = "Pause";
                VIS.last.matrix.timer_id = setInterval(function() {timer_callback(slider) }, timer_interval)
            }

            VIS.last.matrix.playing = !VIS.last.matrix.playing;

            d3.select("button#play-button span")
                .classed({'glyphicon-play': !VIS.last.matrix.playing, 'glyphicon-pause': VIS.last.matrix.playing})
                .attr("title", title);
        }

        function timer_callback(slider) {
            var year = single_step(slider, 1);

            if (year)
                update_matrix(year);
            else
                toggle_animation()
        }

        d3.select("button#play-button")
            .attr("title","Play")
            .on("click",function() {
                toggle_animation();
            });

        d3.select("button#forward-button")
            .attr("title","Step Forward")
            .on("click",function() {
                single_step(slider, 1)
            });

        d3.select("button#backward-button")
            .attr("title","Step Backward")
            .on("click",function() {
                single_step(slider, -1)
            });
    }

    function getTopicClassTag(topic){ return "__topic_" + topic; }
    function getTopicLabel(topic) { return "Topic " + (topic + 1); }

    function toggle_grid_class(labels, grid, selector, state) {

        if (labels) {
            labels.selectAll("." + selector)
                .classed("active", state);
        }

        grid.selectAll("." + selector)
            .classed("active", state);
    }

    function add_topic_labels() {
        var topics = d3.range(args.n_topics);

        var xs = d3.scale.linear()
            .domain( [ 0, args.n_topics -1 ] )
            .range( [ spec.m.left + layout.margins.left, spec.w - spec.m.right ] );

        var ys = d3.scale.linear()
            .domain( [ 0, countries.length -1 ] )
            .range( [ 0, spec.h - spec.m.bottom ] );

        var topic_labels = svg_header.append("svg:g").attr("class", "topic_labels")
            .attr("transform", "translate(" + spec.m.left + ","  + spec.m.top + ")");

        topic_labels.selectAll("text").data(topics).enter()
            .append("text")
            .attr( "class", function(t) { return "normal " + getTopicClassTag(t); } )
            .attr( "transform", function(t, i) { return "translate(" + xs(i) + "," + ys(0) + spec.m.top + ") rotate(290)" } )
            .text( function(t, i) { return getTopicLabel(t); })
            .on('mouseover', function(t, i) { toggle_grid_class(topic_labels, grid, getTopicClassTag(t), true)} )
            .on('mouseout', function(t, i) { toggle_grid_class(topic_labels, grid, getTopicClassTag(t), false)} );

        var grid = svg_body.append("svg:g").attr("class", "topic_grid");

        grid.selectAll( "line" ).data(topics).enter().append("svg:line")
            .attr( "class", function(t) { return "normal " + getTopicClassTag(t); })
            .attr( "x1", function(t,i){ return xs(i) + layout.padding.left; } )
            .attr( "y1", ys(0) )
            .attr( "x2", function(t,i){ return xs(i) + layout.padding.left; } )
            .attr( "y2", ys(countries.length -1) );

        var grid_shadow = svg_body.append("svg:g").attr("class", "grid_shadow");

        grid_shadow.selectAll( "line" ).data(topics).enter().append("svg:line")
            .attr( "class", "hidden_line" )
            .attr( "x1", function(t,i){ return xs(i) + layout.padding.left; } )
            .attr( "y1", ys(0) )
            .attr( "x2", function(t,i){ return xs(i) + layout.padding.left; } )
            .attr( "y2", ys(countries.length -1) )
            .style("pointer-events", "all")
            .on('mouseover', function(t, i) { toggle_grid_class(topic_labels, grid, getTopicClassTag(t), true)} )
            .on('mouseout', function(t, i) { toggle_grid_class(topic_labels, grid, getTopicClassTag(t), false)} );
    }

    function getCountryClassTag(country) { return "__country__" + country; }

    function add_country_labels() {

        var xs = d3.scale.linear()
            .domain([0, args.n_topics - 1])
            .range([spec.m.left + layout.margins.left + layout.padding.left, spec.w - spec.m.right + layout.padding.left]);

        var ys = d3.scale.linear()
            .domain([0, countries.length - 1])
            .range([0, spec.h - spec.m.bottom]);

        var grid = svg_body.append("svg:g").attr("class", "country_grid");

        grid.selectAll("line").data(countries).enter().append("svg:line")
            .attr("class", function (d, i) { return "normal " + getCountryClassTag(i); })
            .attr("x1", xs(0))
            .attr("y1", function (d, i) { return ys(i) })
            .attr("x2", xs(args.n_topics - 1))
            .attr("y2", function (d, i) { return ys(i) });

        var country_labels = svg_body.append("svg:g").attr("class", "country_labels")
            .attr("transform", "translate(" + spec.m.left + "," + 0 + ")");

        country_labels.selectAll("text").data(countries).enter()
            .append("text")
            .attr("class", function (d, i) { return "normal " + getCountryClassTag(i); })
            .attr("transform", function (d, i) {
                return "translate(" + (xs(0) - layout.margins.right) + "," + (ys(i) + layout.padding.bottom ) + ")"
            })
            .text(function (t, i) { return t; })
            .on('mouseover', function(d, i) { toggle_grid_class(country_labels, grid, getCountryClassTag(i), true)} )
            .on('mouseout', function(d, i) { toggle_grid_class(country_labels, grid, getCountryClassTag(i), false)} );

        var grid_shadow = svg_body.append("svg:g").attr("class", "grid_shadow");

        grid_shadow.selectAll("line").data(countries).enter().append("svg:line")
            .attr( "class", "hidden_line" )
            .attr("x1", xs(0))
            .attr("y1", function (d, i) { return ys(i) })
            .attr("x2", xs(args.n_topics - 1))
            .attr("y2", function (d, i) { return ys(i) })
            .style("pointer-events", "all")
            .on('mouseover', function(d, i) {
                toggle_grid_class(country_labels, grid, getCountryClassTag(i), true)}
            )
            .on('mouseout', function(d, i) { toggle_grid_class(country_labels, grid, getCountryClassTag(i), false)} );

    }

    function add_topic_circles() {
        svg_body.append("svg:g")
            .attr("class", "topic_circles");
    }

    function update_topic_circles() {

        var xs = d3.scale.linear()
            .domain( [ 0, args.n_topics -1 ] )
            .range( [ spec.m.left + layout.margins.left, spec.w - spec.m.right ] );

        var ys = d3.scale.linear()
            .domain( [ 0, countries.length -1 ] )
            .range( [ 0, spec.h - spec.m.bottom ] );

        var radius = d3.scale.linear().domain([0, 1]).range([0,50]);

        var circles_group = d3.select("g.topic_circles");

        var circles = circles_group.selectAll("circle")
            .data(args.docs, function(d) { return d.id; });

        function getCountryTopicClassTag(d) {
            return getCountryClassTag(country_index[d.country]) + getTopicClassTag(d.topic);
        }

        function toggle_active_topic(d, state) {

            update_sidebar(d);

            toggle_grid_class(
                d3.select(".topic_labels"),
                d3.selectAll(".topic_grid"),
                getTopicClassTag(d.topic),
                state);

            toggle_grid_class(
                d3.select(".country_labels"),
                d3.selectAll(".country_grid"),
                getCountryClassTag(country_index[d.country]),
                state);

            toggle_grid_class(null, circles_group, getCountryTopicClassTag(d), state);
        }

        circles
            .enter()
            .append("circle")
            .attr( "class", function(d) { return "normal " + getCountryTopicClassTag(d); })
            .attr("cx",function(d) {return xs(d.topic) + layout.padding.left; })
            .attr("cy",function(d) {return ys(country_index[d.country]); })
            .attr("r",function(d) {return radius(d.weight);})
            .on('mouseover', function(d, i) { toggle_active_topic(d, true)} )
            .on('mouseout', function(d, i) { toggle_active_topic(d, false)} );

        circles.exit()
            // .transition()
            // .duration(200)
            // .attr("r", 0)
            .remove();
    }

    function append_weight_tds(sel, f) {
        sel.append("td").classed("weight", true)
            .append("div")
            .classed("proportion", true)
            .style("margin-left", function (w) {
                return d3.format(".1%")(1 - f(w));
            })
            .append("span")
            .classed("proportion", true)
            .html("&nbsp;");
    }

    function update_sidebar(d) {
        var doc = d.doc;

        var doc_label = d3.select("#model_view_matrix_sidebar h3#doc_label");
        doc_label.text(d.year + ", " + countries[country_index[d.country]]);

        view.dfb().doc_summary(doc, function(p) {
            var div = d3.select("div#model_view_matrix_sidebar");

            var trs = div.select("table#matrix_sidebar_doc_topics tbody")
                .selectAll("tr")
                .data(p.topics.slice(0, 5));

            trs.enter().append("tr");
            trs.exit().remove();

            // clear rows
            trs.selectAll("td").remove();

            var as_t = trs.append("td").append("a")
                .attr("href", function (t) {
                    return view.topic.link(t.topic);
                })
                .classed("topic_words", true);
            
            as_t.append("span").classed("name", true)
                .text(function (t, j) {
                    return p.labels[j];
                });

            append_weight_tds(trs, function (t) {
                return t.weight / p.total_tokens;
            });
        });

        var topic_label = d3.select("#model_view_matrix_sidebar h3#topic_label");
        topic_label.text("Topic " + (d.topic + 1));

        view.dfb().topic_summary(d.topic, function(words) {
            var trs_w = d3.select("table#matrix_sidebar_topic_words tbody")
                .selectAll("tr")
                .data(words);

            trs_w.enter().append("tr");
            trs_w.exit().remove();

            trs_w.on("click", function (w) {
                view.dfb().set_view("/word/" + w.word);
            });

            // clear rows
            trs_w.selectAll("td").remove();

            trs_w.append("td").append("a")
                .attr("href", function (w) {
                    return "#/word/" + w.word;
                })
                .text(function (w) { return w.word; });

            view.append_weight_tds(trs_w, function (w) {
                return w.weight / words[0].weight;
            });
        });
    }

    function single_step(slider, step) {

        var next_year = VIS.last.matrix.year + step;
        if (step < 0 && next_year < args.start)
            next_year = args.start;
        else if (step > 0 && next_year > args.end)
            next_year = args.end;

        if (next_year != VIS.last.matrix.year) {
            slider.value(next_year);
            return(next_year);
        }

        return 0;
    }

    if (!VIS.ready.model_matrix) {
        add_slider(args.start, args.end);

        add_topic_labels();
        add_country_labels();
        add_topic_circles();

        VIS.ready.model_matrix = true;
        VIS.last.matrix.playing = false;
    }

    update_topic_circles();

    VIS.last.matrix.year = args.year;

    return true;
};

view.model.matrix_OLD = function(args) {
    // var topic_layer_margin = {
    //     top: 0.3,
    //     left: 1
    // };
    //
    // var country_layer_margin = {
    //     top: 0.4,
    //     left: 0.95,
    //     right: 0
    // };

    var topic_layer_margin = {
        top: 0.3,
        left: 0
    };

    var country_layer_margin = {
        top: 0.5,
        left: 0,
        right: 0
    };

    var docs = args.docs;
    var countries =
        [ 'Afghanistan', 'Angola', 'Albania', 'Andorra', 'United Arab Emirates', 'Argentina', 'Armenia', 'Antigua and Barbuda', 'Australia', 'Austria', 'Azerbaijan', 'Burundi', 'Belgium', 'Benin', 'Burkina Faso', 'Bangladesh', 'Bulgaria', 'Bahrain', 'Bahamas', 'Bosnia and Herzegovina', 'Belarus', 'Belize', 'Bolivia, Plurinational State of', 'Brazil', 'Barbados', 'Brunei Darussalam', 'Bhutan', 'Botswana', 'Central African Republic', 'Canada', 'Switzerland', 'Chile', 'China', 'Cote d\'Ivoire', 'Cameroon', 'Congo, the Democratic Republic of the', 'Congo', 'Colombia', 'Comoros', 'Cabo Verde', 'Costa Rica', 'Cuba', 'Cyprus', 'Czech Republic', 'Germany', 'Djibouti', 'Dominica', 'Denmark', 'Dominican Republic', 'Algeria', 'Ecuador', 'Egypt', 'Eritrea', 'Spain', 'Estonia', 'Ethiopia', 'Finland', 'Fiji', 'France', 'Micronesia, Federated States of', 'Gabon', 'United Kingdom', 'Georgia', 'Ghana', 'Guinea', 'Gambia', 'Guinea-Bissau', 'Equatorial Guinea', 'Greece', 'Grenada', 'Guatemala', 'Guyana', 'Honduras', 'Croatia', 'Haiti', 'Hungary', 'Indonesia', 'India', 'Ireland', 'Iran, Islamic Republic of', 'Iraq', 'Iceland', 'Israel', 'Italy', 'Jamaica', 'Jordan', 'Japan', 'Kazakhstan', 'Kenya', 'Kyrgyzstan', 'Cambodia', 'Saint Kitts and Nevis', 'Korea, Republic of', 'Kuwait', 'Lao People\'s Democratic Republic', 'Lebanon', 'Liberia', 'Saint Lucia', 'Liechtenstein', 'Sri Lanka', 'Lesotho', 'Lithuania', 'Luxembourg', 'Latvia', 'Morocco', 'Monaco', 'Moldova, Republic of', 'Madagascar', 'Maldives', 'Mexico', 'Marshall Islands', 'Macedonia, the former Yugoslav Republic of', 'Mali', 'Malta', 'Myanmar', 'Mongolia', 'Mozambique', 'Mauritania', 'Mauritius', 'Malawi', 'Malaysia', 'Namibia', 'Niger', 'Nigeria', 'Nicaragua', 'Netherlands', 'Norway', 'Nepal', 'Nauru', 'New Zealand', 'Oman', 'Pakistan', 'Panama', 'Peru', 'Philippines', 'Palau', 'Papua New Guinea', 'Poland', 'Korea, Democratic People\'s Republic of', 'Portugal', 'Paraguay', 'Palestine, State of', 'Qatar', 'Romania', 'Russian Federation', 'Rwanda', 'Saudi Arabia', 'Sudan', 'Senegal', 'Singapore', 'Solomon Islands', 'Sierra Leone', 'El Salvador', 'San Marino', 'Somalia', 'Sao Tome and Principe', 'Suriname', 'Slovakia', 'Slovenia', 'Sweden', 'Swaziland', 'Syrian Arab Republic', 'Chad', 'Togo', 'Thailand', 'Tajikistan', 'Turkmenistan', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Tuvalu', 'Tanzania, United Republic of', 'Uganda', 'Ukraine', 'Uruguay', 'United States', 'Uzbekistan', 'Saint Vincent and the Grenadines', 'Venezuela, Bolivarian Republic of', 'Viet Nam', 'Vanuatu', 'Samoa', 'Yemen', 'Yugoslavia', 'South Africa', 'Zambia', 'Zimbabwe' ];

    countries =
        [ 'Afghanistan', 'Angola', 'Albania', 'Andorra'];

    function getTopicClassTag(topic){
        return "__topic_" + topic;
    }

    function getTopicLabel(topic) {
        return "Topic " + (topic + 1);
    }
    function getCountryClassTag(country){
        return "__country__" + country;
    }

    var n_topics = 25;
    var topics = d3.range(n_topics);
    var spec = VIS.model_view.matrix;

    var xs = d3.scale.linear()
        .domain( [ 0, n_topics ] )
        .range( [ spec.m.left, spec.w - spec.m.right ] );

    var ys = d3.scale.linear()
        .domain( [ 0, countries.length ] )
        .range( [ spec.m.top, spec.h - spec.m.bottom ] );

    d3.range(n_topics).map(function(i) {
        console.info(String(i) + ": x " + xs(i) + ", y = " + ys(0)) ;
    });

    var svg = view.plot_svg("#model_view_matrix_grid", spec);
    // var svg = view.append("#model_view_matrix_grid", "svg")
    //     .attr("width", "100%")
    //     .attr("height", "100%");

    var topic_labels = svg.append("svg:g").attr("class", "topic_labels")
        .attr("transform", "translate(10, 0)");

    topic_labels.selectAll("text").data(topics).enter()
        .append("text")
        .attr( "class", function(t) { return "normal " + getTopicClassTag(t); } )
        .attr( "transform", function(t, i) { return "translate(" + xs(i + topic_layer_margin.left) + "," + ys(topic_layer_margin.top) + ") rotate(290)" } )
        .text( function(t, i) { return getTopicLabel(t); });

    var x_grid = svg.append("svg:g").attr("class", "x_grid");

    x_grid.selectAll( "line" ).data(topics).enter().append("svg:line")
        .attr( "y1", ys(topic_layer_margin.top) + spec.m.top )
        .attr( "class", function(t) { return "normal " + getTopicClassTag(t); })
        .attr( "x1", function(t,i){ return xs(i + topic_layer_margin.left) }.bind(this) )
        .attr( "x2", function(t,i){ return xs(i + topic_layer_margin.left) }.bind(this) )
        .attr( "y2", ys(countries.length) );

    var y_grid = svg.append("svg:g").attr("class", "grid");

    y_grid.selectAll( "line" ).data(countries).enter().append("svg:line")
        .attr( "x1", xs(country_layer_margin.left) )
        .attr( "class", function(t, i) { return "normal " + getCountryClassTag(i); } )
        .attr( "x2", xs(topics.length + country_layer_margin.right) )
        .attr( "y1", function(t,i) { return ys(i + country_layer_margin.top) }.bind(this) )
        .attr( "y2", function(t,i) { return ys(i + country_layer_margin.top) }.bind(this) );

    return true;
}