import useTotal from "@/hooks/total.ts";

describe("total hook", () => {
  it("itemsTotal is the accumulated value of every time setTotal is called", () => {
    const { setTotal, itemsTotal } = useTotal();
    const testValue = 1000;
    const secondValue = 200;
    setTotal(testValue);
    setTotal(secondValue);

    expect(itemsTotal.value).toEqual(testValue + secondValue);
  });

  it("itemsTotal works if string passed", () => {
    const { setTotal, itemsTotal } = useTotal();
    const testValue = "1000";
    setTotal(testValue);

    expect(itemsTotal.value).toEqual(+testValue);
  });
});
