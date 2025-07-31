"""
星圖生成工具 - 將AstroMCP輸出轉換為natal格式並生成SVG星圖
Chart Generator - Convert AstroMCP output to natal format and generate SVG charts
"""

import re
import os
import math
from pathlib import Path
from typing import Dict, List, Tuple
from datetime import datetime
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_openai import AzureChatOpenAI
from dotenv import load_dotenv

# 導入 natal 套件
try:
    from natal import Data, Chart
except ImportError:
    print("Warning: natal package not available, using fallback chart generation")
    Data = None
    Chart = None

load_dotenv()
api_base = os.environ["AZURE_OPENAI_ENDPOINT"] = os.getenv("AZURE_OPENAI_ENDPOINT")
api_key = os.environ["AZURE_OPENAI_API_KEY"] = os.getenv("AZURE_OPENAI_API_KEY")
class ChartGenerator:
    """星圖生成器類 - 使用 natal 套件"""

    def __init__(self):
        """初始化星圖生成器"""
        self.planet_mapping = {
            "Sun": "sun",
            "Moon": "moon",
            "Mercury": "mercury",
            "Venus": "venus",
            "Mars": "mars",
            "Jupiter": "jupiter",
            "Saturn": "saturn",
            "Uranus": "uranus",
            "Neptune": "neptune",
            "Pluto": "pluto",
            "North Node": "asc_node",
            "South Node": "asc_node",  # natal 只有 asc_node
            "Chiron": "chiron",
            "Lilith": "lilith"
        }
    
    def parse_astro_text(self, astro_text: str) -> Dict:
        """
        解析AstroMCP的文本輸出，提取星體位置、時間和地點信息

        Args:
            astro_text (str): AstroMCP的文本輸出

        Returns:
            Dict: 包含planets、cusps、birth_time和location的字典
        """
        planets = {}
        cusps = [0] * 12  # 12個宮位
        birth_time = None
        location = None

        try:
            # 解析時間和地點信息
            # 例如: "Astrology Chart (location: New York, USA, at: 1/1/2001, 1:01:00 AM):"
            location_pattern = r"location:\s*([^,]+(?:,\s*[^,]+)*),\s*at:\s*([^)]+)"
            location_match = re.search(location_pattern, astro_text)

            if location_match:
                location_str, time_str = location_match.groups()

                # 解析時間 (轉換為 UTC 格式)
                birth_time = self._parse_birth_time(time_str.strip())

                # 解析地點 (簡化處理，使用預設座標)
                location = self._parse_location(location_str.strip())

            # 解析星體位置 (例如: "Sun is at 10° Capricorn")
            planet_pattern = r"(\w+(?:\s+\w+)*) is at (\d+)° (\w+)"
            planet_matches = re.findall(planet_pattern, astro_text)

            for planet_name, degree, sign in planet_matches:
                if planet_name in self.planet_mapping:
                    # 轉換星座為度數 (每個星座30度)
                    sign_degrees = self._sign_to_degrees(sign)
                    total_degrees = sign_degrees + int(degree)
                    planets[planet_name] = [total_degrees]  # 保持原始名稱用於回退

            # 解析上升星座 (Ascendant)
            asc_pattern = r"Ascendant is at (\d+)° (\w+)"
            asc_match = re.search(asc_pattern, astro_text)
            if asc_match:
                degree, sign = asc_match.groups()
                sign_degrees = self._sign_to_degrees(sign)
                asc_degrees = sign_degrees + int(degree)
                cusps[0] = asc_degrees  # 第一宮宮頭

                # 計算其他宮位 (簡化計算，每宮30度)
                for i in range(1, 12):
                    cusps[i] = (asc_degrees + i * 30) % 360

            # 如果沒有找到上升星座，使用默認值
            if cusps[0] == 0:
                cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]

            return {
                "planets": planets,
                "cusps": cusps,
                "birth_time": birth_time,
                "location": location
            }

        except Exception as e:
            print(f"解析占星文本時發生錯誤: {e}")
            # 返回默認數據
            return {
                "planets": {
                    "Sun": [0],
                    "Moon": [90],
                    "Mercury": [30],
                    "Venus": [60]
                },
                "cusps": [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
                "birth_time": None,
                "location": None
            }
    
    def _sign_to_degrees(self, sign: str) -> int:
        """
        將星座名稱轉換為度數
        
        Args:
            sign (str): 星座名稱
            
        Returns:
            int: 對應的度數
        """
        signs = {
            "Aries": 0, "Taurus": 30, "Gemini": 60, "Cancer": 90,
            "Leo": 120, "Virgo": 150, "Libra": 180, "Scorpio": 210,
            "Sagittarius": 240, "Capricorn": 270, "Aquarius": 300, "Pisces": 330
        }
        return signs.get(sign, 0)

    def _parse_birth_time(self, time_str: str) -> str:
        """
        解析出生時間並轉換為 UTC 格式

        Args:
            time_str (str): 時間字符串，如 "1/1/2001, 1:01:00 AM"

        Returns:
            str: UTC 格式時間字符串，如 "2001-01-01 01:01:00"
        """
        try:
            # 移除多餘的空格和逗號
            time_str = time_str.replace(',', '').strip()

            # 嘗試解析不同的時間格式
            formats = [
                "%m/%d/%Y %I:%M:%S %p",  # 1/1/2001 1:01:00 AM
                "%m/%d/%Y %H:%M:%S",     # 1/1/2001 13:01:00
                "%Y-%m-%d %H:%M:%S",     # 2001-01-01 13:01:00
                "%Y-%m-%d %H:%M",        # 2001-01-01 13:01
            ]

            for fmt in formats:
                try:
                    dt = datetime.strptime(time_str, fmt)
                    return dt.strftime("%Y-%m-%d %H:%M:%S")
                except ValueError:
                    continue

            # 如果都無法解析，返回默認時間
            print(f"無法解析時間格式: {time_str}，使用默認時間")
            return "2000-01-01 12:00:00"

        except Exception as e:
            print(f"解析時間時發生錯誤: {e}")
            return "2000-01-01 12:00:00"

    def _parse_location(self, location_str: str) -> Dict:
        """
        解析地點信息並返回座標

        Args:
            location_str (str): 地點字符串，如 "New York, USA"

        Returns:
            Dict: 包含 lat 和 lon 的字典
        """
        # 簡化處理：根據常見城市返回預設座標
        location_coords = {
            "new york": {"lat": 40.7128, "lon": -74.0060},
            "london": {"lat": 51.5074, "lon": -0.1278},
            "tokyo": {"lat": 35.6762, "lon": 139.6503},
            "taipei": {"lat": 25.0330, "lon": 121.5654},
            "hong kong": {"lat": 22.3193, "lon": 114.1694},
            "singapore": {"lat": 1.3521, "lon": 103.8198},
            "sydney": {"lat": -33.8688, "lon": 151.2093},
            "los angeles": {"lat": 34.0522, "lon": -118.2437},
            "paris": {"lat": 48.8566, "lon": 2.3522},
            "berlin": {"lat": 52.5200, "lon": 13.4050},
        }

        # 轉換為小寫並查找匹配
        location_lower = location_str.lower()
        for city, coords in location_coords.items():
            if city in location_lower:
                return coords

        # 如果找不到匹配，返回台北座標作為默認值
        print(f"未找到地點 '{location_str}' 的座標，使用台北作為默認值")
        return {"lat": 25.0330, "lon": 121.5654}
    
    def generate_chart_svg(self, title: str = "星盤圖",
                          birth_time: str = None, location: Dict = None) -> str:
        """
        使用natal套件生成包含星圖的SVG代碼

        Args:
            chart_data (Dict): 星圖數據 (包含從AstroMCP解析的信息)
            title (str): 圖表標題
            birth_time (str): 出生時間 (UTC格式，如 "1980-04-20 06:30")
            location (Dict): 位置信息 {"lat": 25.0531, "lon": 121.526}

        Returns:
            str: SVG代碼
        """
        try:
            # 如果提供了時間和地點信息，使用 natal 計算星體位置
            if birth_time and location:
                natal_data = Data(
                    name=title,
                    utc_dt=birth_time,
                    lat=location.get("lat", 25.0531),  # 默認台北
                    lon=location.get("lon", 121.526),
                )

                # 生成 SVG 星圖
                chart = Chart(natal_data, width=600, height=600)
                svg_content = chart.svg

                return svg_content

            else:
                # 如果沒有時間地點信息，嘗試從 chart_data 中提取並使用回退方案
                print("警告：沒有提供出生時間和地點，使用回退方案生成簡化星圖")
                # return self._generate_fallback_svg(chart_data, title)

        except Exception as e:
            print(f"使用 natal 生成 SVG 時發生錯誤: {e}")
            # 回退到簡化的 SVG 生成
            # return self._generate_fallback_svg(chart_data, title)

    def _generate_fallback_svg(self, chart_data: Dict, title: str = "星盤圖") -> str:
        """
        生成簡化的 SVG 星圖（回退方案）

        Args:
            chart_data (Dict): 星圖數據
            title (str): 圖表標題

        Returns:
            str: SVG 代碼
        """
        svg_template = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
        <style>
            .chart-title {{ font-family: 'Microsoft JhengHei', Arial, sans-serif; font-size: 18px; font-weight: bold; text-anchor: middle; fill: #4a5568; }}
            .planet-text {{ font-family: Arial, sans-serif; font-size: 14px; text-anchor: middle; fill: #2d3748; }}
            .house-line {{ stroke: #e2e8f0; stroke-width: 1; fill: none; }}
            .zodiac-circle {{ stroke: #cbd5e0; stroke-width: 2; fill: none; }}
            .planet-symbol {{ font-family: Arial, sans-serif; font-size: 16px; text-anchor: middle; fill: #2b6cb0; }}
        </style>
    </defs>

    <!-- 標題 -->
    <text x="300" y="40" class="chart-title">{title}</text>

    <!-- 外圓 (黃道帶) -->
    <circle cx="300" cy="300" r="240" class="zodiac-circle"/>

    <!-- 內圓 (宮位) -->
    <circle cx="300" cy="300" r="180" class="house-line"/>

    <!-- 宮位分割線 -->"""

        # 添加宮位分割線
        for cusp_degree in chart_data.get("cusps", []):
            angle_rad = (cusp_degree - 90) * 3.14159 / 180  # 轉換為弧度，-90度調整起始位置
            x1 = 300 + 180 * math.cos(angle_rad)
            y1 = 300 + 180 * math.sin(angle_rad)
            x2 = 300 + 240 * math.cos(angle_rad)
            y2 = 300 + 240 * math.sin(angle_rad)
            svg_template += f"""
    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" class="house-line"/>"""

        # 添加星體位置
        for planet, positions in chart_data.get("planets", {}).items():
            if positions:
                degree = positions[0]
                angle_rad = (degree - 90) * 3.14159 / 180
                x = 300 + 210 * math.cos(angle_rad)
                y = 300 + 210 * math.sin(angle_rad)

                # 星體符號映射
                planet_symbols = {
                    "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂",
                    "Jupiter": "♃", "Saturn": "♄", "Uranus": "♅", "Neptune": "♆", "Pluto": "♇",
                    "North Node": "☊", "South Node": "☋", "Chiron": "⚷", "Lilith": "⚸"
                }
                symbol = planet_symbols.get(planet, planet[:2])

                svg_template += f"""
    <text x="{x:.1f}" y="{y:.1f}" class="planet-symbol">{symbol}</text>"""

        svg_template += """
</svg>"""
        return svg_template
    
    def save_chart(self, filename: str = "chart.svg", birth_time: str = None, location: Dict = None) -> str:
        """
        保存星圖為SVG文件

        Args:
            chart_data (Dict): 星圖數據 (包含 birth_time 和 location)
            filename (str): 文件名

        Returns:
            str: 保存的文件路徑
        """
        if not birth_time or not location:
            return "❌ 出生時間或地點未提供"
        try:
            # 生成 SVG 內容
            svg_content = self.generate_chart_svg(
                title=filename.replace('.svg', ''),
                birth_time=birth_time,
                location=location
            )

            # 確保charts目錄存在
            charts_dir = Path("charts")
            charts_dir.mkdir(exist_ok=True)

            # 保存文件
            file_path = charts_dir / filename
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(svg_content)

            return str(file_path.absolute())

        except Exception as e:
            print(f"保存星圖時發生錯誤: {e}")
            return ""


# 創建全局星圖生成器實例

_chart_generator = ChartGenerator()

def generate_astrology_interpretations(astro_text: str) -> Dict:
    """
    使用Azure OpenAI GPT-4生成占星解釋

    這個函數分析占星文本數據，並使用LLM生成詳細的個人化解釋。
    解釋內容包括太陽、月亮、上升星座以及各行星的意義和影響。

    Args:
        astro_text (str): AstroMCP的文本輸出，包含星體位置信息
                         應包含格式如 "Sun is at 10° Capricorn" 的星體位置描述

    Returns:
        Dict: 包含各個占星元素詳細解釋的字典，結構如下：
            {
                "sun_sign": {"sign": "星座名", "degree": "度數", "interpretation": "詳細解釋"},
                "moon_sign": {"sign": "星座名", "degree": "度數", "interpretation": "詳細解釋"},
                "ascendant": {"sign": "星座名", "degree": "度數", "interpretation": "詳細解釋"},
                "planets": {
                    "行星名": {"sign": "星座名", "degree": "度數", "interpretation": "詳細解釋"}
                },
                "overall_summary": "整體星盤的綜合分析和主要特質"
            }

    Raises:
        Exception: 當LLM調用失敗時，返回包含錯誤信息的字典

    Note:
        需要設置環境變數 AZURE_OPENAI_ENDPOINT 和 AZURE_OPENAI_API_KEY
    """
    try:
        # 初始化Azure OpenAI客戶端
        llm = AzureChatOpenAI(
            azure_endpoint=api_base,
            api_key=api_key,
            azure_deployment="gpt-4o-testing",
            api_version="2025-01-01-preview",
            temperature=0.7,
            max_tokens=2000,
            timeout=None,
            max_retries=2,
        )

        # 創建占星解釋的提示模板
        interpretation_prompt = ChatPromptTemplate.from_messages([
            ("system", """你是一位專業的占星師，請根據提供的占星圖數據，為每個占星元素提供詳細且有意義的解釋。

請分析以下占星元素並提供解釋：
1. 太陽星座 - 核心個性和生命目標
2. 月亮星座 - 情感需求和內在本質
3. 上升星座 - 外在表現和第一印象
4. 各行星位置 - 不同生活領域的影響
5. 宮位分析 - 生活重點領域

請以JSON格式返回結果，包含以下結構：
{{
    "sun_sign": {{
        "sign": "星座名稱",
        "degree": "度數",
        "interpretation": "詳細解釋"
    }},
    "moon_sign": {{
        "sign": "星座名稱",
        "degree": "度數",
        "interpretation": "詳細解釋"
    }},
    "ascendant": {{
        "sign": "星座名稱",
        "degree": "度數",
        "interpretation": "詳細解釋"
    }},
    "planets": {{
        "planet_name": {{
            "sign": "星座名稱",
            "degree": "度數",
            "interpretation": "詳細解釋"
        }}
    }},
    "overall_summary": "整體星盤的綜合分析和主要特質"
}}

請確保解釋內容：
- 具體且有實用價值
- 避免過於籠統的描述
- 結合星座特質和度數位置
- 提供個人成長建議
- 使用繁體中文"""),
            ("user", "請分析以下占星圖數據：\n\n{astro_text}")
        ])

        # 創建處理鏈
        interpretation_chain = interpretation_prompt | llm | JsonOutputParser()

        # 生成解釋
        result = interpretation_chain.invoke({"astro_text": astro_text})

        return result

    except Exception as e:
        print(f"生成占星解釋時發生錯誤: {e}")
        # 返回默認結構
        return {
            "error": f"解釋生成失敗: {str(e)}",
            "overall_summary": "無法生成詳細解釋，請檢查輸入數據格式"
        }

##=======================================================
# def generate_image_prompt(astro_) -> str:
#     """
#     生成圖片prompt
#     Args:
#         description (str): 描述
#     Returns:
#         str: image_prompt
#     """
#     llm = AzureChatOpenAI(
#         azure_endpoint=api_base,
#         api_key=api_key,
#         azure_deployment="gpt-4o-testing",
#         api_version="2025-01-01-preview",
#         temperature=0.6,
#         max_tokens=None,
#         timeout=None,
#         max_retries=2,
#     )
#     generate_first_prompt_template = ChatPromptTemplate.from_messages(
#         [
#             ("system", "請幫我根據:{description} 整理成...A"),
#             ("user", "description"),
#         ]
#     )
    
#     generate_first_prompt_chain = generate_first_prompt_template | llm | JsonOutputParser()
#     result = generate_first_prompt_chain.invoke({"description": description })
#     if result:  
#         result = result.replace("```json", "").replace("```", "")
#     # generate_second_prompt_template = ChatPromptTemplate.from_messages(
#     #     [
#     #         ("system", system_prompt2),
#     #     ]
#     # )
#     # generate_second_prompt_chain = generate_second_prompt_template | llm | StrOutputParser()
#     # second_prompt = generate_second_prompt_chain.invoke({"first_answer": first_prompt })
#     return prompt
#=======================================================

@tool
def generate_astrology_chart(astro_text: str, location: str,  birth_time: str) -> Tuple[str, Dict]:
    """
    根據占星文本生成星圖和LLM解釋

    功能特色：
    1. 生成SVG格式的星圖文件
    2. 使用LLM分析占星元素並提供個人化解釋
    3. 返回結構化的占星分析數據
    args:
        astro_text: 占星文本
        location: 出生地點
        birth_time: 出生時間
    return:
        file_path: 星圖文件路徑
        interpretations: 占星解釋
    """
    try:
        # 解析占星文本
        # chart_data = _chart_generator.parse_astro_text(astro_text)

        # 生成文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"chart_{timestamp}.svg"

        # 保存星圖
        file_path = _chart_generator.save_chart(filename, birth_time, location)

        # 生成LLM占星解釋
        interpretations = generate_astrology_interpretations(astro_text)
        if file_path:
            # 統計信息
            return {
                "file_path": file_path,
                "interpretations": interpretations,
            }
        else:
            error_result = "❌ 星圖生成失敗，請檢查輸入數據格式"
            return {
                "error": error_result,
                "interpretations": interpretations,
            }

    except Exception as e:
        error_result = f"❌ 星圖生成時發生錯誤：{str(e)}"
        return error_result, {"error": f"處理失敗: {str(e)}"}


@tool
def parse_chart_data(astro_text: str) -> str:
    """
    解析占星文本數據
    
    這個工具用於測試和調試，可以查看從占星文本中提取的結構化數據。
    
    Args:
        astro_text (str): 占星文本
        
    Returns:
        str: 解析後的結構化數據
    """
    try:
        chart_data = _chart_generator.parse_astro_text(astro_text)
        
        result = f"""
📊 解析結果：

🪐 星體位置：
"""
        for planet, position in chart_data["planets"].items():
            result += f"- {planet}: {position[0]}°\n"
        
        result += f"""
🏠 宮位劃分：
"""
        for i, cusp in enumerate(chart_data["cusps"], 1):
            result += f"- 第{i}宮: {cusp}°\n"
        
        return result
        
    except Exception as e:
        return f"❌ 解析失敗：{str(e)}"


@tool
def analyze_birth_chart(birth_date: str, birth_time: str, birth_location: str) -> str:
    """
    完整的出生星盤分析工具

    這個工具會：
    1. 使用提供的出生信息獲取星盤數據
    2. 生成可視化的星圖HTML文件
    3. 返回分析結果和圖表路徑

    Args:
        birth_date (str): 出生日期，格式：YYYY-MM-DD
        birth_time (str): 出生時間，格式：HH:MM
        birth_location (str): 出生地點，例如：台北, 台灣

    Returns:
        str: 包含星盤分析和圖表路徑的完整信息

    Examples:
        - analyze_birth_chart("1992-12-18", "15:00", "台北, 台灣")
        - analyze_birth_chart("1990-06-15", "09:30", "紐約, 美國")
    """
    try:
        # 模擬 AstroMCP 數據（實際應該調用 MCP 工具）
        # 這裡先用模擬數據，後續可以整合真實的 MCP 調用
        simulated_astro_text = f"""
Astrology Chart (location: {birth_location}, at: {birth_date}, {birth_time}):

Ascendant is at 15° Libra. Sun is at 26° Sagittarius. Moon is at 8° Pisces. Mercury is at 10° Capricorn. Venus is at 22° Aquarius. Mars is at 18° Scorpio. Jupiter is at 5° Gemini. Saturn is at 28° Taurus. Uranus is at 12° Aquarius. Neptune is at 16° Aquarius. Pluto is at 23° Sagittarius.
"""

        # 生成星圖
        chart_result = generate_astrology_chart(
            astro_text=simulated_astro_text,
            title=f"{birth_date} {birth_time} 出生星盤"
        )

        # 提取文件路徑
        import re
        file_path_match = re.search(r'文件位置：(.+\.svg)', chart_result)
        chart_file_path = ""
        if file_path_match:
            full_path = file_path_match.group(1)
            # 轉換為相對路徑，供前端使用
            chart_file_path = full_path.replace('\\', '/').split('charts/')[-1]
            if not chart_file_path.startswith('charts/'):
                chart_file_path = f"charts/{chart_file_path}"

        # 組合完整的分析結果
        analysis_result = f"""
🌟 出生星盤分析完成！

📅 出生信息：
- 日期：{birth_date}
- 時間：{birth_time}
- 地點：{birth_location}

{chart_result}

🎯 星圖文件：{chart_file_path}

💫 主要星體位置分析：
- 太陽在射手座26度：具有冒險精神和哲學思維
- 月亮在雙魚座8度：情感豐富，直覺敏銳
- 上升在天秤座15度：注重和諧與美感的外在表現

🔗 要查看完整的星圖，請在瀏覽器中打開生成的HTML文件。
"""

        return analysis_result

    except Exception as e:
        return f"❌ 星盤分析失敗：{str(e)}"


# 導出工具列表
CHART_TOOLS = [
    generate_astrology_chart,
    # parse_chart_data,
    # analyze_birth_chart
]


def get_chart_tools() -> List:
    """
    獲取所有星圖工具

    Returns:
        List: 星圖工具列表
    """
    return CHART_TOOLS


if __name__ == "__main__":
    # 測試星圖生成
    test_text = """Ascendant is at 25° Taurus. Sun is at 26° Sagittarius. Moon is at 16° Libra. Mercury is at 7° Sagittarius. Venus is at 11° Aquarius. Mars is at 25° Cancer. Jupiter is at 12° Libra. Saturn is at 14° Aquarius. Uranus is at 16° Capricorn. Neptune is at 17° Capricorn. Pluto is at 24° Scorpio. North Node is at 21° Sagittarius.\n\nSun is in house 8. Moon is in house 6. Mercury is in house 8. Venus is in house 10. Mars is in house 3. Jupiter is in house 6. Saturn is in house 10. Uranus is in house 9. Neptune is in house 9. Pluto is in house 7. North Node is in house 8.\n\nMoon is in trine with Venus (orb: 4.9°). Moon is in conjunction with Jupiter (orb: 3.9°). Moon is in trine with Saturn (orb: 1.0°). Moon is in square with Uranus (orb: 0.9°). Moon is in square with Neptune (orb: 1.8°). Venus is in trine with Jupiter (orb: 1.0°). Venus is in conjunction with Saturn (orb: 3.9°). Mars is in trine with Pluto (orb: 0.9°). Jupiter is in trine with Saturn (orb: 2.9°). Jupiter is in square with Uranus (orb: 4.8°). Uranus is in conjunction with Neptune (orb: 1.0°)."""

    print("測試星圖生成...")
    # 直接調用底層函數而不是使用 @tool 裝飾器
    try:
        # 解析占星文本
        chart_data = _chart_generator.parse_astro_text(test_text)
        print(chart_data)
        # 生成文件名
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"chart_{timestamp}.svg"

        # 保存星圖
        file_path = _chart_generator.save_chart(chart_data, filename)
    except Exception as e:
        print(f"❌ 星圖生成時發生錯誤：{str(e)}")
        import traceback
        traceback.print_exc()
