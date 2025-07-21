#!/bin/sh
# This script is used to watch for changes and apply them automatically.
spicetify config extensions ""
spicetify apply
spicetify config extensions amai-lyrics.js
spicetify apply
spicetify watch -le