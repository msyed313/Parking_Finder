import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    Dimensions,
    PermissionsAndroid,
    Animated,
    Platform,
    Text,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import Geolocation from "@react-native-community/geolocation";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";

const { width, height } = Dimensions.get("window");

const ParkingFinderHome = () => {
    const [region, setRegion] = useState({
        latitude: 40.748817,
        longitude: -73.985428,
        latitudeDelta: 0.015,
        longitudeDelta: 0.021,
    });
    const [currentLocation, setCurrentLocation] = useState(null);
    const [parkingSpots, setParkingSpots] = useState([]);
    const [parkingDetails, setParkingDetails] = useState();

    useEffect(() => {
        const requestLocationPermission = async () => {
            try {
                let permission;

                if (Platform.OS === "android") {
                    permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
                } else {
                    permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
                }

                let result = await check(permission);

                if (result !== RESULTS.GRANTED) {
                    result = await request(permission);
                    if (result !== RESULTS.GRANTED) {
                        console.error("Location permission not granted.");
                        return;
                    }
                }

                Geolocation.getCurrentPosition(
                    (position) => {
                        //console.error("Position:", position);

                        const { latitude, longitude } = position.coords;
                        const location = {
                            latitude,
                            longitude,
                            latitudeDelta: 0.015,
                            longitudeDelta: 0.0121,
                        };
                        setRegion(location);
                        setCurrentLocation({ latitude, longitude});
                        fetchParkingSpots(latitude, longitude);
                    },
                    (error) => {
                        console.error("Error getting location:", error);
                    },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                );
            } catch (err) {
                console.error("Permission or location error:", err);
            }
        };

        requestLocationPermission();
    }, []);
    const fetchParkingSpots = async (lat, lng) => {
        const delta = 0.01; // bounding box area

        const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="parking"](${lat - delta},${lng - delta},${lat + delta},${lng + delta});out;`;

        const response = await fetch(overpassUrl);
        const json = await response.json();
        // console.error(json);

        const spots = json.elements.map(item => ({
            id: item.id,
            lat: item.lat,
            lon: item.lon,
        }));

        setParkingSpots(json.elements);
    };
    const parkingSpotDetails = (spot) => {
        console.error("Parking Spot Details:", spot);
        setParkingDetails(spot);
    }
    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={region}
                onPress={(e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    setRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.021,
                    });
                    setCurrentLocation({ latitude, longitude });
                    fetchParkingSpots(latitude, longitude);
                    //setParkingDetails(null); // hide previous detail box
                }}
                showsUserLocation={true}
            >

                {currentLocation && (
                    <Marker
                        coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
                        title="Current Location"
                        description="You are here"
                        pinColor="pink"
                    />
                )}
                {parkingSpots.map(spot => (
                    <Marker
                        key={spot.id}
                        coordinate={{ latitude: spot.lat, longitude: spot.lon }}
                        title="Parking Spot"
                        pinColor="green"
                        onPress={() => parkingSpotDetails(spot)}
                    />
                ))}

            </MapView>
            {parkingDetails && (
                <View style={styles.infoBox}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Text style={styles.infoTextHeading}>Parking Name:</Text>
                        <Text style={styles.infoText}>{parkingDetails.tags.name || "Parking"}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Text style={styles.infoTextHeading}>Parking Spot:</Text>
                        <Text style={styles.infoText}>{parkingDetails.tags.parking || "Ground"}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Text style={styles.infoTextHeading}>Parking Operator:</Text>
                        <Text style={styles.infoText}>{parkingDetails.tags.operator || "Private"}</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

export default ParkingFinderHome;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: width,
        height: height,
    },
    infoBox: {
        position: "absolute",
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: "white",
        padding: 15,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 5,
        overflow: "hidden",

    },
    infoText: {
        fontSize: width * 0.05,
        color: "blue",
        marginBottom: 5,
    },
    infoTextHeading: {
        fontSize: width * 0.05,
        color: "black",
        fontWeight: "bold",
        marginBottom: 5,
    },
});
