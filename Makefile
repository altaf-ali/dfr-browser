# Makefile Usage
# make lint -- linting
# make uglify -- compile minified source file
# make tarball -- create dfb.tar.gz file suitable for deployment as a website

# Name of minified output file
dfbjs := js/dfb.min.js
minified := js/utils.min.js js/worker.min.js

# locations of javascript source files
# manual dependency tracking, because node-style require is for another day
src_before := src/view/view.js
src_after := src/dfb.js
src_skip := src/utils.js src/worker.js
src := $(wildcard src/*.js src/*/*.js)

src := $(filter-out $(min_js) $(src_skip) $(src_before) $(src_after),$(src))
src := $(src_before) $(src) $(src_after)

css := $(wildcard css/*.css)
lib := $(wildcard lib/*)

dfb_files := index.html $(dfbjs) $(minified) \
    $(css) $(lib) fonts/

lint:
	jslint --regexp --todo --white --browser --bitwise $(src) $(src_skip)

uglify: $(dfbjs) $(minified)

$(minified): js/%.min.js: src/%.js
	uglifyjs $< --mangle -o $@

$(dfbjs): $(src)
	uglifyjs $(src) --mangle -o $@

dfb.tar.gz: $(dfb_files)
	rm -f $@
	tar -cvzf $@ $(dfb_files) data/*

tarball: dfb.tar.gz

NUM_TOPICS := 30
OPTIMIZE_INT := 20

MODEL_DIR := ./model
DATA_DIR := ./data

MALLET_STATE := $(MODEL_DIR)/mallet_state.gz
TOPIC_KEYS := $(MODEL_DIR)/topic_keys.txt
DOC_TOPICS := $(MODEL_DIR)/doc_topics.txt
INFO_STUB := $(MODEL_DIR)/info.json

CITATIONS := $(MODEL_DIR)/citations.tsv
COUNTRIES := $(MODEL_DIR)/countries.json
METADATA := $(MODEL_DIR)/meta.csv.zip
TW_JSON := $(MODEL_DIR)/tw.json
DT_JSON := $(MODEL_DIR)/dt.json.zip
SESSIONS := $(MODEL_DIR)/sessions.json

CORPUS_SOURCE := ./un_debates
CORPUS := $(MODEL_DIR)/corpus.dat

MALLET := ~/usr/local/mallet/bin/mallet
PREPDATA := ./bin/prepare-data

SESSIONS_DIR := ./sessions
MK_SESSION_INDEX := ./bin/mk_session_index.py

corpus:
	$(MALLET) import-dir --input $(CORPUS_SOURCE) --output $(CORPUS) --keep-sequence --remove-stopwords

lda:
	$(MALLET) train-topics --input $(CORPUS) --num-topics $(NUM_TOPICS) --optimize-interval $(OPTIMIZE_INT) --output-state $(MALLET_STATE) --output-topic-keys $(TOPIC_KEYS) --output-doc-topics $(DOC_TOPICS)

info-stub:
	$(PREPDATA) $@ -o $(INFO_STUB)

convert-state:
	$(PREPDATA) $@ $(MALLET_STATE) --tw $(TW_JSON) --dt $(DT_JSON)

convert-citations:
	$(PREPDATA) $@ $(CITATIONS) -o $(METADATA)

session-index:
	$(MK_SESSION_INDEX) $(SESSIONS_DIR) $(SESSIONS)

build: info-stub convert-state convert-citations

release:
	cp -v $(INFO_STUB) $(DATA_DIR)
	cp -v $(COUNTRIES) $(DATA_DIR)
	cp -v $(TW_JSON) $(DATA_DIR)
	cp -v $(DT_JSON) $(DATA_DIR)
	cp -v $(METADATA) $(DATA_DIR)
	cp -v $(SESSIONS) $(DATA_DIR)

none:
	echo "missing target"

.DEFAULT_GOAL := none

.PHONY: lint uglify tarball
