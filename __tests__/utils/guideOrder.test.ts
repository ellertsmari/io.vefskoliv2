import { planOrderShift } from "utils/guideOrder";

const guides = (orders: number[]) => orders.map((order) => ({ id: `g${order}`, order }));

describe("planOrderShift", () => {
  it("slides the guides between the old and new number up when a guide moves down the list", () => {
    // Guide 2 becomes 6 among 3,4,5,6,7,8.
    expect(planOrderShift(guides([1, 3, 4, 5, 6, 7, 8]), 2, 6)).toEqual([
      { id: "g3", order: 2 },
      { id: "g4", order: 3 },
      { id: "g5", order: 4 },
      { id: "g6", order: 5 },
    ]);
  });

  it("slides the guides between the new and old number down when a guide moves up the list", () => {
    // Guide 6 becomes 2 among 1,2,3,4,5,7.
    expect(planOrderShift(guides([1, 2, 3, 4, 5, 7]), 6, 2)).toEqual([
      { id: "g2", order: 3 },
      { id: "g3", order: 4 },
      { id: "g4", order: 5 },
      { id: "g5", order: 6 },
    ]);
  });

  it("pushes the target and everything after it when a guide arrives from another module", () => {
    expect(planOrderShift(guides([1, 2, 3, 4]), null, 2)).toEqual([
      { id: "g2", order: 3 },
      { id: "g3", order: 4 },
      { id: "g4", order: 5 },
    ]);
  });

  it("moves nothing when the number is free or unchanged", () => {
    expect(planOrderShift(guides([1, 3, 4, 7]), 1, 5)).toEqual([]);
    expect(planOrderShift(guides([1, 3, 4, 7]), null, 5)).toEqual([]);
    expect(planOrderShift(guides([1, 3, 4, 7]), 3, 3)).toEqual([]);
  });

  it("keeps gaps and moves duplicates together", () => {
    // Hand-imported data: two guides at 4, nothing at 5.
    expect(planOrderShift([...guides([2, 3, 4, 6]), { id: "g4b", order: 4 }], 2, 4)).toEqual([
      { id: "g3", order: 2 },
      { id: "g4", order: 3 },
      { id: "g4b", order: 3 },
    ]);
  });
});
