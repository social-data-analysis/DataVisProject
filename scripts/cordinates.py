import googlemaps
import pandas as pd

df = pd.read_csv('Film_Locations_in_San_Francisco.csv')

df.drop(['Fun Facts'], axis=1, inplace=True)

df = df[pd.notnull(df['Locations'])]
df = df[pd.notnull(df['Production Company'])]
df = df[pd.notnull(df['Distributor'])]
df = df[pd.notnull(df['Writer'])]
df = df[pd.notnull(df['Actor 1'])]
df = df[pd.notnull(df['Actor 2'])]
df = df[pd.notnull(df['Actor 3'])]

# Add city to address.
def add_city(row):
    return row['Locations'] + ', San Francisco'

df['Locations'] = df.apply(add_city, axis=1)

# Remove newline from Production Company.
def remove_newline(row):
    return row['Production Company'].replace('\n', ' ').replace('\r', '')

df['Production Company'] = df.apply(remove_newline, axis=1)

gmaps = googlemaps.Client(key='AIzaSyB_4PJSqeGRn7KhH1DIstc1Qx5aRlQ6k7I')

# Create new column with coordinates.
def create_coordinates(row):
    
    geocode_result = gmaps.geocode(row['Locations'])
    
    if geocode_result:
        return str(geocode_result[0]['geometry']['location']['lat']) + ' ' + str(geocode_result[0]['geometry']['location']['lng'])
    else:
        return None

df['Coordinates'] = df.apply(create_coordinates, axis=1)

#print(df.isnull().sum())

df = df[pd.notnull(df['Coordinates'])]

df.to_csv('Film_Locations_in_San_Francisco_with_coordinates2.csv', sep=',', index=False)

#print(df['Locations'].value_counts())
#print(df['Title'].nunique())