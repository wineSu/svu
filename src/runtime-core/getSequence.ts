/**
 * 最长递增子序列
 * [6,3,5,10,11,2,9,14,13,7,4,8,16]
 * 
 * 第一步：
 *  按照扑克牌的算法进行二分法查找，得到最终每一堆中牌尾的索引
 *  
 *  堆1   堆2   堆3   堆4   堆5
 *  6     5     10    11    14
 *  3     4     9     8     13
 *  2           7           16
 * 
 * 牌尾：[2, 4, 7, 8, 16] 对应索引：[5, 10, 9, 11, 12]
 * ----------------------------------------------------
 * 
 * 第二步：
 *  求解目标（唯一值）
 *  pArr的计算，新的牌入堆的时候右侧一定大于左侧的值，所以新插入的需要记录上一个堆的牌尾索引
 *  pArr: [-1, -1, 1, 2, 3, -1, 2, 4, 4, 2, 5, 9, 11]
 *  由于堆的最右侧的牌尾是最大的
 *  所以可以从牌尾索引倒序从 pArr 中往前寻找
 *  最终为目标值。
 * 
 *  实际目标不唯一，比如 16 后面是 15 （此时最长公共子序列结果至少有两个）
 *  
 */
export function getSequence(arr: number[]) {
    let topIndex = [];
    let pArr = [];
    // 牌堆数初始化为 0
    let piles = 0;
    for (let i = 0, len = arr.length; i < len; i++) {
        let poker = arr[i];
        let left = 0, right = piles;
        while (left < right) {
            let mid = Math.floor((left + right) / 2);
            if (arr[topIndex[mid]] < poker) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        // 新建堆
        if (left == piles){
             piles++
        };
        // 记录每一堆牌顶索引
        topIndex[left] = i;
        pArr.push(topIndex[left-1] || -1);
    }
    // 挑选
    let u = topIndex.length;
    let v = topIndex[u - 1];
    while (u-- > 0) {
        topIndex[u] = v;
        v = pArr[v];
    }
    // 增长序列
    return topIndex;
}