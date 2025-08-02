import os
from pathlib import Path
from langchain_core.tools import tool
import time
from natal import Data, Chart


@tool("natal_figure")
def natal_figure(utc_dt: str, lat: float, lon: float) -> Data:
    """
    Generate a natal chart using provided birth data.

    Args:
        utc_dt (str): Birth date and time in UTC format (e.g., "1980-04-20 06:30")
        lat (float): Latitude of birth location (e.g., 25.0531 for Taipei)
        lon (float): Longitude of birth location (e.g., 121.526 for Taipei)

    The function generates the chart, saves it as an SVG image in the /charts directory,
    and returns the Data object containing all astrological information.

    Returns:
        Data: The natal chart data object containing planets, houses, aspects, and other
              astrological information for the provided birth chart.
    """
    try:
        # Create chart data object with MiMi's birth information
        natal_data = Data(
            name="User",
            utc_dt=utc_dt,
            lat=lat,  # Latitude for Taipei, Taiwan
            lon=lon,  # Longitude for Taipei, Taiwan
        )
        
        # Create the natal chart with specified width
        chart = Chart(natal_data, width=600)
        
        # Ensure charts directory exists
        # Get the project root directory (go up from backend/agents/tools to project root)
        project_root = Path(__file__).parent.parent.parent.parent
        charts_dir = project_root / "frontend" / "public" / "charts"
        charts_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate SVG content
        svg_content = chart.svg
        
        # Save the chart as an SVG file
        chart_filename = f"123_natal_chart.svg"
        chart_path = charts_dir / chart_filename
        
        
        with open(chart_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        
        print(f"✅ Natal chart saved successfully: {chart_path}")
        print(f"📊 Chart contains {len(natal_data.planets)} planets, {len(natal_data.houses)} houses, and {len(natal_data.aspects)} aspects")
        output_path = os.path.join(charts_dir, chart_filename)
        # Return the Data object for further use
        return output_path
        
    except Exception as e:
        error_msg = f"❌ Error generating natal chart: {str(e)}"
        print(error_msg)
        raise Exception(error_msg)
