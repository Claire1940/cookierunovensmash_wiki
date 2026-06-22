"""
JSON 值提取和重组工具

用于优化翻译流程：
1. 从 JSON 中提取所有需要翻译的字符串值
2. 翻译值列表（而不是整个 JSON）
3. 使用翻译后的值重建 JSON 结构
"""

import json
from typing import Any, Dict, List, Tuple


class JSONValueExtractor:
    """提取和重组 JSON 中的可翻译值"""

    def __init__(self):
        self.values: List[str] = []
        self.structure_map: Dict[str, int] = {}
        self.index: int = 0

    def extract_values(self, json_obj: dict, path: str = "") -> Tuple[List[str], Dict[str, int]]:
        """
        从 JSON 对象中提取所有字符串值

        Args:
            json_obj: 要提取的 JSON 对象
            path: 当前路径（内部使用）

        Returns:
            - values: 需要翻译的字符串列表
            - structure_map: 结构映射（路径 -> 索引）
        """
        # 重置状态
        self.values = []
        self.structure_map = {}
        self.index = 0

        # 递归提取
        self._extract_recursive(json_obj, path)

        return self.values, self.structure_map

    def _extract_recursive(self, obj: Any, path: str):
        """递归提取所有字符串值"""
        if isinstance(obj, dict):
            for key, value in obj.items():
                new_path = f"{path}.{key}" if path else key
                self._extract_recursive(value, new_path)
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                new_path = f"{path}[{i}]"
                self._extract_recursive(item, new_path)
        elif isinstance(obj, str):
            # 保存值和路径
            self.structure_map[path] = self.index
            self.values.append(obj)
            self.index += 1
        # 忽略其他类型（数字、布尔值等）

    def rebuild_json(self, original_obj: dict, translated_values: List[str]) -> dict:
        """
        使用翻译后的值重建 JSON

        Args:
            original_obj: 原始 JSON 对象（用作模板）
            translated_values: 翻译后的值列表

        Returns:
            重建的 JSON 对象
        """
        # 创建深拷贝
        result = json.loads(json.dumps(original_obj))

        # 替换所有值
        for path, index in self.structure_map.items():
            if index < len(translated_values):
                self._set_value_by_path(result, path, translated_values[index])
            else:
                print(f"  [WARN] 索引 {index} 超出翻译值范围，路径: {path}")

        return result

    def _set_value_by_path(self, obj: Any, path: str, value: str):
        """
        根据路径设置值

        Args:
            obj: 目标对象
            path: 路径字符串（如 "common.home" 或 "items[0].name"）
            value: 要设置的值
        """
        # 解析路径
        keys = path.replace('[', '.').replace(']', '').split('.')
        current = obj

        # 导航到目标位置
        for key in keys[:-1]:
            if key.isdigit():
                current = current[int(key)]
            else:
                current = current[key]

        # 设置最终值
        last_key = keys[-1]
        if last_key.isdigit():
            current[int(last_key)] = value
        else:
            current[last_key] = value


def test_extractor():
    """测试值提取和重组功能"""
    print("=== 测试 JSONValueExtractor ===\n")

    # 测试数据
    test_json = {
        "common": {
            "home": "Home",
            "more": "More",
            "playNow": "Play Now"
        },
        "hero": {
            "title": "Slayerbound Wiki",
            "subtitle": "Your ultimate resource"
        },
        "items": [
            {"name": "Sword", "desc": "A sharp blade"},
            {"name": "Shield", "desc": "Protective gear"}
        ]
    }

    print("原始 JSON:")
    print(json.dumps(test_json, indent=2))
    print()

    # 提取值
    extractor = JSONValueExtractor()
    values, structure_map = extractor.extract_values(test_json)

    print(f"提取的值 ({len(values)} 个):")
    for i, value in enumerate(values):
        print(f"  [{i}] {value}")
    print()

    print("结构映射:")
    for path, index in structure_map.items():
        print(f"  {path} -> [{index}]")
    print()

    # 模拟翻译（简单替换为中文）
    translated = [
        "首页", "更多", "立即游玩",
        "Slayerbound 维基", "您的终极资源",
        "剑", "锋利的刀刃",
        "盾", "防护装备"
    ]

    print(f"翻译后的值 ({len(translated)} 个):")
    for i, value in enumerate(translated):
        print(f"  [{i}] {value}")
    print()

    # 重组 JSON
    result = extractor.rebuild_json(test_json, translated)

    print("重组后的 JSON:")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print()

    # 验证结构
    def get_keys(obj, prefix=''):
        keys = set()
        if isinstance(obj, dict):
            for k, v in obj.items():
                keys.add(f"{prefix}.{k}" if prefix else k)
                keys.update(get_keys(v, f"{prefix}.{k}" if prefix else k))
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                keys.update(get_keys(item, f"{prefix}[{i}]"))
        return keys

    original_keys = get_keys(test_json)
    result_keys = get_keys(result)

    if original_keys == result_keys:
        print("✓ 键结构验证通过")
    else:
        print("✗ 键结构验证失败")
        print("  缺失:", original_keys - result_keys)
        print("  多余:", result_keys - original_keys)


if __name__ == "__main__":
    test_extractor()
