/**
 * The profile fields a user may fill in and share with the class.
 *
 * Lives here, not in models/user, because browser code needs it: importing
 * anything as a value from a model file pulls mongoose and the MongoDB driver
 * into the page's JavaScript.
 */
export enum OptionalUserInfoKeys {
  background = "background",
  careerGoals = "careerGoals",
  interests = "interests",
  favoriteArtists = "favoriteArtists",
  avatarUrl = "avatarUrl",
}
