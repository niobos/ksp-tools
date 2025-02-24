import {Data} from "dataclass";

export class Location extends Data {
    latitude: number
    longitude: number
    altitude?: number

    toStringDegrees(decimals: number = 1): string {
        const ns = this.latitude >= 0 ? "N" : "S";
        const ew = this.longitude >= 0 ? "E" : "W";
        return `${ns} ${(Math.abs(this.latitude) / Math.PI * 180).toFixed(decimals)}º` +
            ` ${ew} ${(Math.abs(this.longitude) / Math.PI * 180).toFixed(decimals)}º`;
    }

    static greatCircle(a: Location, b: Location): {distance: number, direction: number} {
        // https://en.wikipedia.org/wiki/Great-circle_navigation
        const dlon = b.longitude - a.longitude
        const sin_a_lat = Math.sin(a.latitude);
        const sin_b_lat = Math.sin(b.latitude);
        const cos_a_lat = Math.cos(a.latitude);
        const cos_b_lat = Math.cos(b.latitude);
        const sin_dlon = Math.sin(dlon);
        const cos_dlon = Math.cos(dlon);
        const distance = Math.atan2(
            Math.sqrt(
                Math.pow(cos_a_lat * sin_b_lat - sin_a_lat * cos_b_lat * cos_dlon, 2)
                + Math.pow(cos_b_lat * sin_dlon, 2)
            ),
            sin_a_lat * sin_b_lat + cos_a_lat * cos_b_lat * cos_dlon
        );
        const direction = Math.atan2(
            cos_b_lat * sin_dlon,
            cos_a_lat * sin_b_lat - sin_a_lat * cos_b_lat * cos_dlon,
        );
        return {distance, direction};
    }
    static greatCircleDistance(a: Location, b: Location): number {
        // https://en.wikipedia.org/wiki/Great-circle_navigation
        const dlon = b.longitude - a.longitude
        const sin_a_lat = Math.sin(a.latitude);
        const sin_b_lat = Math.sin(b.latitude);
        const cos_a_lat = Math.cos(a.latitude);
        const cos_b_lat = Math.cos(b.latitude);
        const cos_dlon = Math.cos(dlon);
        return Math.atan2(
            Math.sqrt(
                Math.pow(cos_a_lat * sin_b_lat - sin_a_lat * cos_b_lat * cos_dlon, 2)
                + Math.pow(cos_b_lat * Math.sin(dlon), 2)
            ),
            sin_a_lat * sin_b_lat + cos_a_lat * cos_b_lat * cos_dlon
        );
    }
    static greatCircleDirection(a: Location, b: Location): number {
        // https://en.wikipedia.org/wiki/Great-circle_navigation
        const dlon = b.longitude - a.longitude;
        const cos_b_lat = Math.cos(b.latitude);
        return Math.atan2(
            cos_b_lat * Math.sin(dlon),
            Math.cos(a.latitude) * Math.sin(b.latitude) - Math.sin(a.latitude) * cos_b_lat * Math.cos(dlon),
        );
    }

    move(direction: number, distance: number): Location {
        const azimuthAtEquator = Math.atan2(
            Math.sin(direction) * Math.cos(this.latitude),
            Math.sqrt(
                Math.pow(Math.cos(direction), 2)
                + Math.pow(Math.sin(direction) * Math.sin(this.latitude), 2)
            )
        );
        const distanceFromNode = Math.atan2(
            Math.tan(this.latitude),
            Math.cos(direction),
        );
        const dlonOfNode = Math.atan2(
            Math.sin(azimuthAtEquator) * Math.sin(distanceFromNode),
            Math.cos(distanceFromNode)
        );
        const longitudeOfNode = this.longitude - dlonOfNode;
        const dlon = Math.atan2(
            Math.sin(azimuthAtEquator) * Math.sin(distanceFromNode + distance),
            Math.cos(distanceFromNode + distance)
        );
        return Location.create({
            latitude: Math.atan2(
                Math.cos(azimuthAtEquator) * Math.sin(distanceFromNode + distance),
                Math.sqrt(
                    Math.pow(Math.cos(distanceFromNode + distance), 2)
                    + Math.pow(Math.sin(azimuthAtEquator) * Math.sin(distanceFromNode + distance), 2)
                )
            ),
            longitude: longitudeOfNode + dlon,
        })
    }
}

export function sphericalGrid(numPoints: number = 1000): Location[] {
    // https://stackoverflow.com/a/26127012
    const phi = Math.PI * (3 - Math.sqrt(5));  // golden angle in radians
    const out = [];
    for (let i = 0; i < numPoints; i++) {
        const y = 1 - (i / (numPoints - 1)) * 2;  // y goes from 1 to -1
        const radius = Math.sqrt(1 - y * y);  // radius at y
        const theta = phi * i;  // golden angle increment
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        const loc = Location.create({latitude: Math.asin(z), longitude: Math.atan2(y, x)});
        out.push(loc);
    }
    return out;
}