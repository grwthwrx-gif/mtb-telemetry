#!/bin/bash

grep -R "require(" ./screens | grep -E "\.png|\.jpg|\.jpeg|\.gif" | while read line; do
  file_path=$(echo "$line" | sed -E 's/.*require\((.*)\).*/\1/' | tr -d '"')
  file_line=$(echo "$line" | cut -d: -f1)
  if [[ $file_path == ./* ]]; then
    fixed_path="../${file_path#./}"
    echo "Updating $file_path → $fixed_path in $file_line"
    sed -i "s|$file_path|$fixed_path|g" "$file_line"
  fi
done

