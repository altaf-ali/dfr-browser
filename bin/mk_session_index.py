#!/usr/bin/env python

import os
import re
import json
import argparse

SESSION_FOLDER_PATTERN = "^Session\s(\d{1,2})"
SESSION_FILE_PATTERN = "^%s_(\d+)\.pdf$"

parser = argparse.ArgumentParser()
parser.add_argument("source_folder")
parser.add_argument("index_filename")

args = parser.parse_args()

sessions = dict()

for folder in os.listdir(args.source_folder):
    match = re.match(SESSION_FOLDER_PATTERN, folder)
    if not match:
        print("skipping " + folder)
        continue

    session_id = match.group(1)

    meetings = list()
    filenames = list()

    folder_path = os.path.join(args.source_folder, folder)
    files = os.listdir(folder_path)
    for filename in files:
        match = re.match(SESSION_FILE_PATTERN % session_id, filename)
        if not match:
            print("  skipping " + filename)
            continue

        meetings.append(match.group(1))
        filenames.append(os.path.join(folder_path, filename))

    sessions[session_id] = {
        'labels': meetings,
        'files': filenames
    }

print("writing index: " + args.index_filename)
with open(args.index_filename, 'w') as outfile:
    json.dump(sessions, outfile, sort_keys = False, indent = 4)