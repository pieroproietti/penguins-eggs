#!/bin/bash

LATEST_CONTAINER=$(podman ps -a --sort created --format "{{.ID}}" | head -n 1)
podman rm $LATEST_CONTAINER
