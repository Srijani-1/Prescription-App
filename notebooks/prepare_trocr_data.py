import pandas as pd
import os

# Paths
BASE_PATH = "data/raw/bd_dataset/Doctor's Handwritten Prescription BD dataset/Training"
IMG_DIR = os.path.join(BASE_PATH, "training_words")
CSV_PATH = os.path.join(BASE_PATH, "training_labels.csv")

df = pd.read_csv(CSV_PATH, header=None)

# Rename columns
df.columns = ["image", "short", "full"]

# Keep only image + full name
df = df[["image", "full"]]

# Add full image path
df["image"] = df["image"].apply(lambda x: os.path.join(IMG_DIR, x))

print(df.head())
