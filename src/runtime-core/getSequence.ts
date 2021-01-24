export function getSequence(arr: number[]): number[] {
    let top = new Array(nums.length);
    // 牌堆数初始化为 0
    let piles = 0;
    for (let i = 0; i < nums.length; i++) {
        // 要处理的扑克牌
        let poker = nums[i];

        /***** 搜索左侧边界的二分查找 *****/
        let left = 0, right = piles;
        while (left < right) {
            let mid = parseInt((left + right) / 2);
            if (top[mid] > poker) {
                right = mid;
            } else if (top[mid] < poker) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        /*********************************/
        
        // 没找到合适的牌堆，新建一堆
        if (left == piles){
             piles++
        };
        // 把这张牌放到牌堆顶
        console.log(left, i, poker)
        top[left] = poker;
    }
    console.log(top)
    // 牌堆数就是 LIS 长度
    return piles
}