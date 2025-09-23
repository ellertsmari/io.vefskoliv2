import { connect, clearDatabase, closeDatabase, createDummyUser, createDummyGuide } from "../__mocks__/mongoHandler";
import { getGalleryItems } from "serverActions/getGallery";
import { Return } from "models/return";
import { Review, Vote } from "models/review";
import mongoose from "mongoose";

describe("getGalleryItems", () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it("returns recommended submissions with gallery metadata", async () => {
    const student = await createDummyUser("user", { name: "Gallery Student" });
    const reviewer = await createDummyUser("user", { name: "Peer Reviewer" });
    const guide = await createDummyGuide();

    const projectLiveUrl = "https://example.com/live";
    const projectRepoUrl = "https://github.com/example/project";
    const projectImageUrl = "https://example.com/project.png";

    const userReturn = await Return.create({
      projectUrl: projectRepoUrl,
      liveVersion: projectLiveUrl,
      pictureUrl: projectImageUrl,
      projectName: "Responsive Portfolio",
      comment: "A responsive single page portfolio built with Next.js.",
      owner: student._id,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      guide: guide._id,
    });

    await Review.create({
      guide: guide._id,
      return: userReturn._id,
      owner: reviewer._id,
      vote: Vote.RECOMMEND_TO_GALLERY,
      comment: "Outstanding work!",
      createdAt: new Date("2024-01-02T00:00:00.000Z"),
    });

    const galleryItems = await getGalleryItems();

    expect(galleryItems).toHaveLength(1);

    const [item] = galleryItems;

    expect(item).toMatchObject({
      returnId: userReturn._id.toString(),
      title: "Responsive Portfolio",
      description: "A responsive single page portfolio built with Next.js.",
      studentName: "Gallery Student",
      recommendationCount: 1,
      returnImage: projectImageUrl,
      returnGif: null,
      returnUrl: projectLiveUrl,
      guideTitle: guide.title,
    });

    expect(item.module).toMatchObject({
      title: guide.module.title,
      number: guide.module.number,
    });
  });

  it("excludes returns without gallery recommendation and prefers gif previews", async () => {
    const student = await createDummyUser("user", { name: "Gif Student" });
    const reviewer = await createDummyUser();
    const guide = await createDummyGuide();

    const gifUrl = "https://example.com/demo.gif";

    const recommendedReturn = await Return.create({
      projectUrl: "https://github.com/example/gif-project",
      liveVersion: "https://example.com/demo",
      pictureUrl: gifUrl,
      projectName: "Animation Showcase",
      comment: "Interactive animation demo.",
      owner: student._id,
      createdAt: new Date("2024-02-10T00:00:00.000Z"),
      guide: guide._id,
    });

    const otherReturn = await Return.create({
      projectUrl: "https://github.com/example/regular",
      liveVersion: "https://example.com/regular",
      pictureUrl: "https://example.com/regular.png",
      projectName: "Standard Project",
      comment: "A solid submission.",
      owner: new mongoose.Types.ObjectId(),
      createdAt: new Date("2024-02-11T00:00:00.000Z"),
      guide: guide._id,
    });

    await Review.create({
      guide: guide._id,
      return: recommendedReturn._id,
      owner: reviewer._id,
      vote: Vote.RECOMMEND_TO_GALLERY,
      comment: "Great animations!",
      createdAt: new Date("2024-02-12T00:00:00.000Z"),
    });

    await Review.create({
      guide: guide._id,
      return: otherReturn._id,
      owner: reviewer._id,
      vote: Vote.PASS,
      comment: "Nice work.",
      createdAt: new Date("2024-02-12T00:00:00.000Z"),
    });

    const galleryItems = await getGalleryItems();

    expect(galleryItems).toHaveLength(1);
    expect(galleryItems[0].returnId).toBe(recommendedReturn._id.toString());
    expect(galleryItems[0].returnGif).toBe(gifUrl);
    expect(galleryItems[0].returnImage).toBeNull();
  });
});
