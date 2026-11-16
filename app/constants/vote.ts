/**
 * A reviewer's verdict on a return.
 *
 * Lives here, not in models/review, because browser code needs it: importing
 * anything as a value from a model file pulls mongoose and the MongoDB driver
 * into the page's JavaScript.
 */
export enum Vote {
  NO_PASS = "no pass",
  PASS = "pass",
  RECOMMEND_TO_GALLERY = "recommend to Hall of fame",
}
